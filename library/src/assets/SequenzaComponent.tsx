import { RendererComponent, extractFields, type Uniforms, type Patch } from "@sequenza/lib";
import "@sequenza/lib/style.css";
import { useEffect, useRef } from "react";

function SequenzaComponent() {
  const uniformRef = useRef<Record<string, Uniforms>>(getInitialUniforms());

  useEffect(() => {
    const patch = getPatch();

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
  }, []);

  return (
    <RendererComponent
      patch={getPatch()}
      uniforms={uniformRef}
      animate={true}
      width={100}
      height={100}
    ></RendererComponent>
  );
}

export default SequenzaComponent;

function getInitialUniforms(): Record<string, Uniforms> {
  throw new Error("placeholder for initial uniforms");
}

function getPatch(): Patch {
  throw new Error("placeholder for patch");
}
