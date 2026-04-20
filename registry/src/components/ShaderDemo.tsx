import { RendererComponent, extractFields, type Uniforms, type Patch } from "@sequenza/lib";
import { buildEditorState, type EditorInitialState } from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useEffect, useRef } from "react";

interface ShaderDemoProps {
  patch: Patch;
  initialUniforms: Record<string, Uniforms>;
  width: number;
  height: number;
  className?: string;
  handleEdit?: (initialState: EditorInitialState) => void;
}

export function ShaderDemo({ patch, initialUniforms, width, height, className, handleEdit }: ShaderDemoProps) {
  const uniformRef = useRef<Record<string, Uniforms>>(
    JSON.parse(JSON.stringify(initialUniforms))
  );

  useEffect(() => {
    const timeFields: Array<{ shaderId: string; fieldName: string }> = [];
    const mouseFields: Array<{ shaderId: string; fieldName: string }> = [];

    for (const shader of patch.shaders) {
      const fields = extractFields(shader);
      for (const field of fields) {
        if (field.type === "float" && field.special === "time") {
          timeFields.push({ shaderId: shader.id, fieldName: field.name });
        } else if (field.type === "vec2" && field.special === "mouse") {
          mouseFields.push({ shaderId: shader.id, fieldName: field.name });
        } else if (field.type === "vec2" && field.special === "resolution") {
          uniformRef.current[shader.id] ??= {};
          uniformRef.current[shader.id][field.name] = [
            shader.resolution.width,
            shader.resolution.height,
          ];
        }
      }
    }

    let onMouseMove: ((e: MouseEvent) => void) | undefined;
    if (mouseFields.length > 0) {
      onMouseMove = (e: MouseEvent) => {
        const x = Math.min(1, e.clientX / window.innerWidth);
        const y = Math.min(1, e.clientY / window.innerHeight);
        for (const { shaderId, fieldName } of mouseFields) {
          uniformRef.current[shaderId] ??= {};
          uniformRef.current[shaderId][fieldName] = [x, y];
        }
      };
      window.addEventListener("mousemove", onMouseMove);
    }

    let rafId: number | undefined;
    if (timeFields.length > 0) {
      const startTime = performance.now();
      const loop = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        for (const { shaderId, fieldName } of timeFields) {
          uniformRef.current[shaderId] ??= {};
          uniformRef.current[shaderId][fieldName] = elapsed;
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      if (onMouseMove) window.removeEventListener("mousemove", onMouseMove);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative w-full h-full group overflow-clip ${className ?? "rounded-md"}`}>
      <RendererComponent
        patch={patch}
        uniforms={uniformRef}
        animate={true}
        width={width}
        height={height}
        className="w-full h-full"
      />
      {handleEdit && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 group-hover:opacity-100 opacity-0 transition group-hover:transition-none duration-200">
          <button
            className="button-base"
            onClick={() => handleEdit(buildEditorState(patch, initialUniforms))}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
