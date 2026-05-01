import { useState, type FC } from "react";
import { exportSequenzaPatch } from "@sequenza/lib";
import type { Patch, Uniforms } from "@sequenza/lib";
import { Dialog } from "./Dialog";
import type { UniformExpressions } from "./EditorContext";

interface ExportDialogProps {
  uniforms: Record<string, Uniforms>;
  uniformExpressions?: UniformExpressions;
  patch: Patch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const installCommand = "pnpm i @sequenza/lib";

type Tab = "react" | "json" | "prompt";

export const ExportDialog: FC<ExportDialogProps> = ({
  uniforms,
  uniformExpressions,
  patch,
  open,
  onOpenChange,
}) => {
  const generatedCode = exportSequenzaPatch(uniforms, patch, uniformExpressions);
  const jsonExport = JSON.stringify({ uniforms, uniformExpressions, shader: patch }, null, 2);
  const llmPrompt = `I have a Sequenza shader export — a self-contained React component that renders a GLSL shader composition using @sequenza/lib. Here it is:\n\n${generatedCode}\n\nPlease integrate this into my project. It accepts no props and renders the shader full-width inside whatever container it's placed in. The \`animate\` prop drives a requestAnimationFrame loop for shaders that use a time uniform. Let me know if you need anything else.`;

  const [tab, setTab] = useState<Tab>("react");
  const [installCopied, setInstallCopied] = useState<"idle" | "done">("idle");
  const [contentCopied, setContentCopied] = useState<"idle" | "done">("idle");

  const copyInstall = () => {
    navigator.clipboard.writeText(installCommand);
    setInstallCopied("done");
    setTimeout(() => setInstallCopied("idle"), 1800);
  };

  const copyContent = () => {
    const text = tab === "react" ? generatedCode : tab === "json" ? jsonExport : llmPrompt;
    navigator.clipboard.writeText(text);
    setContentCopied("done");
    setTimeout(() => setContentCopied("idle"), 1800);
  };

  const tabValue = tab === "react" ? generatedCode : tab === "json" ? jsonExport : llmPrompt;

  return (
    <Dialog
      open={open}
      handleOpenChange={onOpenChange}
      className="flex flex-col gap-4 p-6 overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-800">
          Integrate shader
        </h2>
        <button className="button-base" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
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
        <div className="flex gap-1">
          {(["react", "json", "prompt"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setContentCopied("idle"); }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                tab === t
                  ? "bg-neutral-200 text-neutral-800"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t === "react" ? "React" : t === "json" ? "JSON" : "Prompt"}
            </button>
          ))}
        </div>
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
    </Dialog>
  );
};
