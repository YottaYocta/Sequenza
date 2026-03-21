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
    handleUpdateUniforms,
    handleUpdateNode,
    showStats,
    setOpenExportNodeId,
    openPreviewNodeId,
    setOpenPreviewNodeId,
  } = useContext(EditorContext);

  const [localUniforms, setLocalUniforms] = useState<Uniforms>(() => {
    const saved = uniforms.current[data.shader.id];
    if (saved && Object.keys(saved).length > 0) return saved;
    const defaults: Uniforms = {};
    for (const field of extractFields(data.shader)) {
      const def = getFieldDefault(field);
      if (def !== undefined) defaults[field.name] = def;
    }
    return defaults;
  });

  useEffect(() => {
    handleUpdateUniforms(id, () => localUniforms);
  }, [localUniforms]);

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
				flex flex-col gap-4 bg-white rounded-lg p-6 relative transition-[outline] outline-neutral-200 duration-75
				${selected ? "outline-4" : "outline-0"}
			`}
    >
      <p className="text-sm w-min py-1 px-2 bg-neutral-100 rounded-lg text-neutral-500 text-nowrap">
        {data.shader.name}
      </p>
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
      {textureInputs.map((input) => (
        <CustomHandle
          key={input}
          id={input}
          type="target"
          position={Position.Top}
        />
      ))}
      <div className="flex gap-8">
        <div className="flex flex-col gap-2">
          <UniformForm
            shader={data.shader}
            uniforms={localUniforms}
            handleUpdateUniform={(newUniforms) => {
              setLocalUniforms(newUniforms);
            }}
          />
        </div>
        <div className="flex flex-col justify-center items-start gap-4 ">
          <div className="flex flex-col gap-2">
            <div className="relative max-w-96 group">
              <div className="flex absolute top-2 right-2 gap-2">
                <button
                  className={`button-base group-hover:opacity-100 opacity-0`}
                  onClick={() => setOpenPreviewNodeId(id)}
                >
                  Expand
                </button>
                <PreviewDialog
                  open={openPreviewNodeId === id}
                  onOpenChange={(open) => {
                    setOpenPreviewNodeId(open ? id : null);
                  }}
                  shader={data.shader}
                  patch={patches[data.shader.id]}
                  uniforms={uniforms}
                  localUniforms={localUniforms}
                  nodeId={id}
                  handleUpdateUniforms={(_, newUniforms) => {
                    setLocalUniforms(newUniforms);
                  }}
                  handleUpdateNode={handleUpdateNode}
                />
                <button
                  className={`button-base ${data.paused ? "opacity-100" : "group-hover:opacity-100 opacity-0"}`}
                  onClick={() => {
                    handleUpdateNode(id, (snapshot) => {
                      return { ...snapshot, paused: !snapshot.paused };
                    });
                  }}
                >
                  {data.paused ? "Resume" : "Pause"}
                </button>
              </div>
              <RendererComponent
                ref={canvasRef}
                animate={!data.paused}
                width={width}
                height={height}
                patch={patches[data.shader.id]}
                uniforms={uniforms}
                className="w-full h-auto"
                style={{ maxWidth: `${(width / height) * 24}rem` }}
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
