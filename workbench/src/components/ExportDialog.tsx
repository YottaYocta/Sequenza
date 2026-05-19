import { useRef, useState, type FC, type RefObject } from "react";
import { exportSequenzaPatch, RendererComponent } from "@sequenza/lib";
import type { Patch, Uniforms } from "@sequenza/lib";
import { Dialog } from "./Dialog";
import { Scrubber } from "./Scrubber";
import type { UniformExpressions } from "./EditorContext";

interface ExportDialogProps {
  uniforms: Record<string, Uniforms>;
  uniformsRef: RefObject<Record<string, Uniforms>>;
  uniformExpressions?: UniformExpressions;
  patch: Patch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const installCommand = "pnpm i @sequenza/lib";

type Tab = "image" | "react" | "json" | "prompt";

const TAB_LABELS: Record<Tab, string> = {
  image: "Image",
  react: "React",
  json: "JSON",
  prompt: "Prompt",
};

export const ExportDialog: FC<ExportDialogProps> = ({
  uniforms,
  uniformsRef,
  uniformExpressions,
  patch,
  open,
  onOpenChange,
}) => {
  const generatedCode = exportSequenzaPatch(
    uniforms,
    patch,
    uniformExpressions,
  );
  const jsonExport = JSON.stringify(
    { uniforms, uniformExpressions, shader: patch },
    null,
    2,
  );
  const llmPrompt = `I have a Sequenza shader export — a self-contained React component that renders a GLSL shader composition using @sequenza/lib. Here it is:\n\n${generatedCode}\n\nPlease integrate this into my project. It accepts no props and renders the shader full-width inside whatever container it's placed in. The \`animate\` prop drives a requestAnimationFrame loop for shaders that use a time uniform. Let me know if you need anything else.`;

  const [tab, setTab] = useState<Tab>("image");
  const [installCopied, setInstallCopied] = useState<"idle" | "done">("idle");
  const [contentCopied, setContentCopied] = useState<"idle" | "done">("idle");
  const [imageCopied, setImageCopied] = useState<"idle" | "done">("idle");
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const outputShader = patch.shaders[patch.shaders.length - 1];
  const { width, height } = outputShader.resolution;
  const exportWidth = Math.floor(width * scale);
  const exportHeight = Math.floor(height * scale);

  const copyInstall = () => {
    navigator.clipboard.writeText(installCommand);
    setInstallCopied("done");
    setTimeout(() => setInstallCopied("idle"), 1800);
  };

  const copyContent = () => {
    const text =
      tab === "react" ? generatedCode : tab === "json" ? jsonExport : llmPrompt;
    navigator.clipboard.writeText(text);
    setContentCopied("done");
    setTimeout(() => setContentCopied("idle"), 1800);
  };

  const copyImage = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob)
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    });
    setImageCopied("done");
    setTimeout(() => setImageCopied("idle"), 1800);
  };

  const downloadImage = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${outputShader.name}.png`;
    a.click();
  };

  const tabValue =
    tab === "react" ? generatedCode : tab === "json" ? jsonExport : llmPrompt;

  return (
    <Dialog
      open={open}
      handleOpenChange={onOpenChange}
      className="flex flex-col gap-4 p-6 overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-800">Export Shader</h2>
        <button className="button-base" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
      <div className="flex gap-1">
        {(["image", "react", "json", "prompt"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setContentCopied("idle");
            }}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              tab === t
                ? "bg-neutral-200 text-neutral-800"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      {tab === "image" ? (
        <div className="flex flex-col gap-4">
          <div className="bg-black rounded overflow-clip w-fit max-w-128">
            <RendererComponent
              ref={canvasRef}
              animate={true}
              patch={patch}
              uniforms={uniformsRef}
              width={exportWidth}
              height={exportHeight}
              className="w-full h-auto"
              style={{ maxWidth: `${(width / height) * 36}rem` }}
            />
          </div>
          <div className="flex flex-col">
            <p className="text-xs text-neutral-400 tabular-nums">
              {exportWidth} x {exportHeight}
            </p>

            <div className="flex gap-2 items-center">
              <span className="font-mono text-xs text-neutral-900">
                Upscale factor
              </span>
              <div className="bg-neutral-100 p-1 rounded-md">
                <Scrubber
                  value={scale}
                  min={1}
                  step={0.01}
                  onChange={setScale}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button className="button-base w-fit" onClick={copyImage}>
              {imageCopied === "done" ? "Copied!" : "Copy Image to Clipboard"}
            </button>
            <button className="button-base w-fit" onClick={downloadImage}>
              Download Image
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-neutral-500">Install</p>
            <div className="flex items-center gap-2 bg-neutral-50 rounded py-4 px-4">
              <code className="text-xs text-neutral-700 w-full select-all">
                {installCommand}
              </code>
              <button className="button-base" onClick={copyInstall}>
                {installCopied === "done" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="relative flex-1 min-h-0 bg-neutral-50 rounded">
              <button
                className="absolute top-4 right-4 button-base"
                onClick={copyContent}
              >
                {contentCopied === "done" ? "Copied!" : "Copy"}
              </button>
              <textarea
                readOnly
                value={tabValue}
                className="w-full h-full resize-none bg-transparent text-xs text-neutral-700 font-mono p-4 pr-12 outline-none"
              />
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
};
