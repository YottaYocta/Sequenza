import { useRef, useState, type FC, type RefObject } from "react";
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
  nodeId: string;
  handleUpdateUniforms: (shaderId: string, uniforms: Uniforms) => void;
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
  nodeId,
  handleUpdateUniforms,
  handleUpdateNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { width, height } = shader.resolution;

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

      <div className="flex gap-6 px-6 pb-6 overflow-y-auto flex-1 min-h-0 ">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
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

            <div className="flex gap-2 h-min">
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

          <div className="flex flex-col gap-2">
            <p className="text-xs text-neutral-500">Uniforms</p>
            <UniformForm
              shader={shader}
              initialUniforms={uniforms.current[shader.id]}
              handleUpdateUniform={(newUniforms) =>
                handleUpdateUniforms(shader.id, newUniforms)
              }
            />
          </div>
        </div>
        <div className="flex bg-neutral-50 rounded overflow-hidden w-1/2 shrink-0 items-center justify-center">
          <RendererComponent
            ref={canvasRef}
            animate
            width={width}
            height={height}
            patch={patch}
            uniforms={uniforms}
            className={`${width > height ? "w-full" : "h-full"}`}
          />
        </div>
      </div>
    </Dialog>
  );
};
