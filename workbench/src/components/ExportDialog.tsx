import { type FC } from "react";
import { exportSequenzaPatch } from "@sequenza/lib";
import type { Patch, Uniforms } from "@sequenza/lib";
import { Dialog } from "./Dialog";

interface ExportDialogProps {
  uniforms: Record<string, Uniforms>;
  patch: Patch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const installCommand = "pnpm i @sequenza/lib";

export const ExportDialog: FC<ExportDialogProps> = ({
  uniforms,
  patch,
  open,
  onOpenChange,
}) => {
  const generatedCode = exportSequenzaPatch(uniforms, patch);

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
          <button
            className="button-base"
            onClick={() => navigator.clipboard.writeText(installCommand)}
          >
            Copy
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <p className="text-xs text-neutral-500">Component</p>
        <div className="relative flex-1 min-h-0 bg-neutral-50 rounded">
          <button
            className="absolute top-4 right-4 button-base"
            onClick={() => navigator.clipboard.writeText(generatedCode)}
          >
            Copy
          </button>
          <textarea
            readOnly
            value={generatedCode}
            className="w-full h-full resize-none bg-transparent text-xs text-neutral-700 font-mono p-4 pr-12 outline-none"
          />
        </div>
      </div>
    </Dialog>
  );
};
