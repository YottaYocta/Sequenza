import { useState, type FC } from "react";
import type { Shader } from "@sequenza/lib";
import { Dialog } from "./Dialog";

interface AddShaderDialogProps {
  open: boolean;
  handleOpenChange: (open: boolean) => void;
  shaders: Shader[];
  handleAddShader: (shader: Shader) => void;
}

export const AddShaderDialog: FC<AddShaderDialogProps> = ({
  open,
  handleOpenChange,
  shaders,
  handleAddShader,
}) => {
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} handleOpenChange={handleOpenChange}>
      <div className="w-full h-full flex flex-col p-4 gap-4">
        <div className="w-full flex justify-between">
          <p>Add a Shader</p>
          <button
            className="button-base"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </button>
        </div>
        <div className="w-full flex flex-col h-full overflow-hidden gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shaders..."
            className="text-xs p-1 rounded-sm border border-neutral-200 outline-none mb-1"
          />
          <div className="h-full flex flex-col overflow-y-auto">
            {shaders
              .filter((s) =>
                s.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((shader) => (
                <button
                  key={shader.id}
                  className="text-xs flex justify-start p-1 rounded-sm hover:bg-neutral-100 cursor-pointer text-neutral-500"
                  onClick={() => {
                    handleAddShader(shader);
                    handleOpenChange(false);
                  }}
                >
                  {shader.id}
                </button>
              ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
