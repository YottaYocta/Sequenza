import { useEffect, useRef, useState, type FC, type RefObject } from "react";
import { RendererComponent } from "@sequenza/lib";
import type { Patch, Shader, Uniforms } from "@sequenza/lib";
import { Dialog } from "./Dialog";
import { ExportDialog } from "./ExportDialog";
import UniformForm from "./UniformForm";
import { Scrubber } from "./Scrubber";
import type { ShaderNodeData } from "./ShaderNode";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shader: Shader;
  patch: Patch;
  uniforms: RefObject<Record<string, Uniforms>>;
  localUniforms: Uniforms;
  nodeId: string;
  handleUpdateUniforms: (
    shaderId: string,
    uniformCallback: (snapshot: Uniforms) => Uniforms,
  ) => void;
  handleUpdateNode: (
    nodeId: string,
    fn: (s: ShaderNodeData) => ShaderNodeData,
  ) => void;
}

export const PreviewDialog: FC<PreviewDialogProps> = ({
  open,
  onOpenChange,
  shader,
  patch,
  uniforms,
  localUniforms,
  nodeId,
  handleUpdateUniforms,
  handleUpdateNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [shaderError, setShaderError] = useState<{
    message: string;
    line: number;
    shaderName: string;
  } | null>(null);

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
  const [containerSize, setContainerSize] = useState({ w: 1, h: 1 });
  const { width, height } = shader.resolution;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setContainerSize({ w, h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    a.download = `${shader.name}.png`;
    a.click();
  };

  return (
    <Dialog
      open={open}
      handleOpenChange={onOpenChange}
      className="flex flex-col w-full h-full"
    >
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <h2 className="text-sm font-medium text-neutral-800">{shader.name}</h2>
        <button className="button-base" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>

      <div className="flex gap-16 px-6 pb-6  flex-1 min-h-0 items-center">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <UniformForm
              shader={shader}
              uniforms={localUniforms}
              handleUpdateUniform={(newUniforms) =>
                handleUpdateUniforms(shader.id, newUniforms)
              }
            />
          </div>
        </div>
        <div className="h-full w-full flex flex-col gap-4 ">
          <div
            ref={containerRef}
            className={`flex bg-neutral-50 rounded w-4/5 items-center justify-center h-full`}
          >
            <RendererComponent
              ref={canvasRef}
              animate
              width={width}
              height={height}
              patch={patch}
              uniforms={uniforms}
              className={
                width / height > containerSize.w / containerSize.h
                  ? "w-full"
                  : "h-full"
              }
              onError={(msg) => setShaderError(msg)}
            />
          </div>
          <div className="flex flex-col gap-2 ">
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-md w-min">
              <Scrubber
                label="w"
                value={width}
                min={1}
                step={1}
                onChange={(w) =>
                  handleUpdateNode(nodeId, (s) => ({
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
                  handleUpdateNode(nodeId, (s) => ({
                    ...s,
                    shader: { ...s.shader, resolution: { width, height: h } },
                  }))
                }
              />
            </div>

            <div className="flex gap-1 h-min w-min">
              <button
                className="button-base"
                onClick={() => setExportOpen(true)}
              >
                Export
              </button>
              <ExportDialog
                uniforms={uniforms.current}
                patch={patch}
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
        </div>
      </div>
      {shaderError && (
        <div className="flex flex-col gap-2 mx-6 mb-6 p-2 bg-white border-2 border-red-100 rounded-md">
          <p className="text-white w-min text-nowrap bg-red-700 px-2 py-1 rounded text-xs">
            {shaderError.shaderName}
          </p>
          <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap break-all">
            {getErrorSnippet(shaderError.message, shaderError.line)}
          </pre>
          <button
            className="self-start text-xs px-2 py-1 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer"
            onClick={() => navigator.clipboard.writeText(shaderError.message)}
          >
            Copy error
          </button>
        </div>
      )}
    </Dialog>
  );
};
