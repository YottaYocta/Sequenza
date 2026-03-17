import { Position, type Node, type NodeProps } from "@xyflow/react";
import CustomHandle from "./CustomHandle";
import type { Shader, Uniforms } from "@sequenza/lib";
import { useContext, useMemo, useRef, useState, type RefObject } from "react";
import { Scrubber } from "./Scrubber";
import UniformForm from "./UniformForm";
import { RendererComponent } from "@sequenza/lib";
import { EditorContext } from "./EditorContext";
import { extractFields } from "@sequenza/lib";
import { ExportDialog } from "./ExportDialog";

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
  } = useContext(EditorContext);

  if (!patches || patches[data.shader.id] === undefined) return null;

  const { width, height } = data.shader.resolution;
  const [exportOpen, setExportOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const copyImage = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob)
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    });
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

  return (
    <div
      className={`
				flex gap-8 bg-white rounded-lg p-6 relative transition-[outline] outline-neutral-200 duration-75
				${selected ? "outline-4" : "outline-0"}
			`}
    >
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
      <div className="flex flex-col gap-2">
        <UniformForm
          shader={data.shader}
          initialUniforms={uniforms.current[data.shader.id]}
          handleUpdateUniform={(newUniforms) => {
            handleUpdateUniforms(data.shader.id, newUniforms);
          }}
        ></UniformForm>
      </div>
      <div className="flex flex-col justify-center items-start gap-4 ">
        <div className="flex flex-col gap-2">
          <div className="relative max-w-96 group">
            <button
              className={`absolute top-2 right-2 button-base ${data.paused ? "opacity-100" : "group-hover:opacity-100 opacity-0"}`}
              onClick={() => {
                handleUpdateNode(id, (snapshot) => {
                  return { ...snapshot, paused: !snapshot.paused };
                });
              }}
            >
              {data.paused ? "Resume" : "Pause"}
            </button>
            <RendererComponent
              ref={canvasRef}
              animate={!data.paused}
              width={width}
              height={height}
              patch={patches[data.shader.id]}
              uniforms={uniforms}
              className="w-full h-auto"
              style={{ maxWidth: `${(width / height) * 24}rem` }}
            ></RendererComponent>
          </div>
          <div className="flex gap-2">
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
        <div className="flex gap-2">
          <button className="button-base" onClick={() => setExportOpen(true)}>
            Export
          </button>
          <ExportDialog
            uniforms={uniforms.current}
            patch={patches[data.shader.id]}
            open={exportOpen}
            onOpenChange={setExportOpen}
          />
          <button className="button-base" onClick={copyImage}>
            Copy
          </button>
          <button className="button-base" onClick={saveImage}>
            Save
          </button>
        </div>
      </div>
      <CustomHandle id="out" type="source" position={Position.Bottom} />
    </div>
  );
};
