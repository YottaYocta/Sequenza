import { Position, type Node, type NodeProps } from "@xyflow/react";
import CustomHandle from "./CustomHandle";
import type { Shader, Uniforms } from "@sequenza/lib";
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Scrubber } from "./Scrubber";
import UniformForm from "./UniformForm";
import { RendererComponent } from "@sequenza/lib";
import { EditorContext } from "./EditorContext";
import { extractFields, getFieldDefault } from "@sequenza/lib";
import { PreviewDialog } from "./PreviewDialog";

export type ShaderNodeData = {
  shader: Shader;
  paused: boolean;
  uniforms: RefObject<Record<string, Uniforms>>;
};

export type ShaderNode = Node<ShaderNodeData, "shader">;
export const ShaderNode = ({ data, selected, id }: NodeProps<ShaderNode>) => {
  const {
    patches,
    uniforms,
    uniformDefs,
    handleUpdateUniforms,
    handleUpdateNode,
    showStats,
    setOpenExportNodeId,
    openPreviewNodeId,
    setOpenPreviewNodeId,
  } = useContext(EditorContext);

  const [uniformState, setUniformState] = useState<Uniforms>(() => {
    const saved = uniforms.current[data.shader.id] ?? {};
    const fields = extractFields(data.shader);
    const merged: Uniforms = { ...saved };
    for (const field of fields) {
      if (!(field.name in merged)) {
        const def = getFieldDefault(field);
        if (def !== undefined) merged[field.name] = def;
      }
    }
    return merged;
  });

  const [uniformDefState, setUniformDefState] = useState<Uniforms>(() => {
    const editorDefs = uniformDefs.current[data.shader.id] ?? {};
    const merged: Uniforms = { ...editorDefs };
    for (const field of extractFields(data.shader)) {
      if (field.type === "sampler2D") continue;
      if (field.defaultExpr !== undefined && !(field.name in merged)) {
        merged[field.name] = field.defaultExpr as any;
      }
    }
    return merged;
  });

  useEffect(() => {
    handleUpdateUniforms(data.shader.id, () => uniformState);
  }, []);

  useEffect(() => {
    uniformDefs.current[data.shader.id] = uniformDefState;
  }, [uniformDefState]);

  const handleUpdateUniformDef = (
    fieldName: string,
    slotIndex: number | null,
    value: string | null,
    fieldLength?: number,
  ) => {
    setUniformDefState((prev) => {
      const next = { ...prev };
      if (slotIndex === null) {
        next[fieldName] = value as any;
      } else {
        const prevArr = Array.isArray(prev[fieldName])
          ? [...(prev[fieldName] as (string | null)[])]
          : null;
        const len = prevArr?.length ?? fieldLength ?? slotIndex + 1;
        const arr: (string | null)[] = prevArr ?? Array(len).fill(null);
        while (arr.length <= slotIndex) arr.push(null);
        arr[slotIndex] = value;
        next[fieldName] = (arr.every((s) => s === null) ? null : arr) as any;
      }
      return next;
    });
  };

  const handleFieldUpdate = (fieldName: string, value: any) => {
    setUniformState((prev) => ({ ...prev, [fieldName]: value }));
    handleUpdateUniforms(data.shader.id, (current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const { width, height } = data.shader.resolution;
  const [shaderError, setShaderError] = useState<{
    message: string;
    line: number;
    shaderName: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageCopied, setImageCopied] = useState<"idle" | "done">("idle");
  const [errorCopied, setErrorCopied] = useState<"idle" | "done">("idle");

  const copyImage = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob)
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    });
    setImageCopied("done");
    setTimeout(() => setImageCopied("idle"), 1800);
  };

  const saveImage = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.shader.name}.png`;
    a.click();
  };

  const textureInputs = useMemo<string[]>(() => {
    return extractFields(data.shader)
      .filter((f) => f.type === "sampler2D" && f.source === "input")
      .map((f) => f.name);
  }, [data.shader]);

  const getErrorSnippet = (message: string, line: number): string => {
    const parts = message.split(/\n(?=\d+: )/);
    const lineMap: Record<number, string> = {};
    for (const part of parts) {
      const m = part.match(/^(\d+): ([\s\S]*)/);
      if (m) lineMap[parseInt(m[1], 10)] = m[2].trimEnd();
    }
    const start = Math.max(1, line - 3);
    const end = line + 3;
    const lines: string[] = [];
    for (let i = start; i <= end; i++) {
      if (lineMap[i] !== undefined) lines.push(`${i}: ${lineMap[i]}`);
    }
    return lines.join("\n");
  };

  if (!patches || patches[data.shader.id] === undefined) return null;

  return (
    <div
      className={`
				flex flex-col gap-8 bg-white rounded-lg p-6 relative  outline-neutral-200
				${selected ? "outline-neutral-300 outline-4" : "outline-0"}
        group min-w-96 items-center justify-center 
			`}
    >
      <div className="w-full flex justify-between">
        <p className="text-sm w-min py-1 px-2 text-lg rounded-md text-neutral-500 text-nowrap max-w-32">
          {data.shader.name.charAt(0).toUpperCase() + data.shader.name.slice(1)}
        </p>
        <div className="flex gap-2">
          <button
            className={`button-base group-hover:block hidden`}
            onClick={() => setOpenPreviewNodeId(id)}
          >
            Expand
          </button>
          <PreviewDialog
            open={openPreviewNodeId === id}
            onOpenChange={(open) => setOpenPreviewNodeId(open ? id : null)}
            shader={data.shader}
            patch={patches[data.shader.id]}
            uniforms={uniforms}
            savedUniforms={uniformState}
            uniformDefs={uniformDefState}
            nodeId={id}
            handleFieldUpdate={handleFieldUpdate}
            handleUpdateNode={handleUpdateNode}
            handleUpdateUniformDef={handleUpdateUniformDef}
          />
          <button
            className={`button-base ${data.paused ? "" : "group-hover:block hidden"}`}
            onClick={() => {
              handleUpdateNode(id, (snapshot) => {
                return { ...snapshot, paused: !snapshot.paused };
              });
            }}
          >
            {data.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
      {showStats && (
        <>
          <p className="text-xs text-neutral-500 absolute -top-6">
            ID: {data.shader.id}
          </p>
          <p className="text-xs text-neutral-500 absolute -top-10">
            {data.shader.name}
          </p>
        </>
      )}
      {textureInputs.map((input, idx) => (
        <CustomHandle
          key={input}
          id={input}
          type="target"
          position={Position.Top}
          count={{
            total: textureInputs.length,
            index: idx,
          }}
        />
      ))}
      <div className="flex gap-8">
        <UniformForm
          shader={data.shader}
          savedUniforms={uniformState}
          uniformDefs={uniformDefState}
          handleUpdateUniform={handleFieldUpdate}
          handleUpdateUniformDef={handleUpdateUniformDef}
        />
        <div className="flex flex-col justify-center items-start gap-4 ">
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              <button
                className="button-base"
                onClick={() => setOpenExportNodeId(id)}
              >
                Export
              </button>
              <button className="button-base" onClick={copyImage}>
                {imageCopied === "done" ? "Copied!" : "Copy"}
              </button>
              <button className="button-base" onClick={saveImage}>
                Save
              </button>
            </div>
            <div className="relative max-w-144">
              <RendererComponent
                ref={canvasRef}
                animate={!data.paused}
                width={width}
                height={height}
                patch={patches[data.shader.id]}
                uniforms={uniforms}
                className="w-full h-auto"
                style={{ maxWidth: `${(width / height) * 36}rem` }}
                onError={(msg) => {
                  setShaderError(msg);
                }}
              ></RendererComponent>
            </div>
            <div className="flex gap-1 bg-neutral-100 rounded-md p-1 w-min">
              <Scrubber
                label="w"
                value={width}
                min={1}
                step={1}
                onChange={(w) =>
                  handleUpdateNode(id, (s) => ({
                    ...s,
                    shader: { ...s.shader, resolution: { width: w, height } },
                  }))
                }
              />
              <Scrubber
                label="h"
                value={height}
                min={1}
                step={1}
                onChange={(h) =>
                  handleUpdateNode(id, (s) => ({
                    ...s,
                    shader: { ...s.shader, resolution: { width, height: h } },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>
      {shaderError && (
        <div className="flex flex-col gap-2 p-2 bg-white border-2 border-red-100 rounded-md relative">
          <p className="text-white w-min text-nowrap bg-red-700 px-2 py-1 rounded text-xs">
            {shaderError.shaderName}
          </p>
          <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap break-all">
            {getErrorSnippet(shaderError.message, shaderError.line)}
          </pre>
          <button
            className="self-start text-xs px-2 py-1 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(shaderError.message);
              setErrorCopied("done");
              setTimeout(() => setErrorCopied("idle"), 1800);
            }}
          >
            {errorCopied === "done" ? "Copied!" : "Copy error"}
          </button>
        </div>
      )}
      <CustomHandle id="out" type="source" position={Position.Bottom} />
    </div>
  );
};
