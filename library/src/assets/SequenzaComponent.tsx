import { RendererComponent, type Uniforms, type Patch } from "@sequenza/lib";
import "@sequenza/lib/style.css";
// @ts-expect-error mathjs is a peer dependency of the exported component, not the library
import { create, all } from "mathjs";
import { useEffect, useRef } from "react";

const math = create(all);

function SequenzaComponent() {
  const uniformRef = useRef<Record<string, Uniforms>>(getInitialUniforms());

  useEffect(() => {
    const patch = getPatch();
    const defs = getUniformDefs();
    const mouse: [number, number] = [0, 0];

    const resolutionMap: Record<string, [number, number]> = {};
    for (const shader of patch.shaders) {
      resolutionMap[shader.id] = [
        shader.resolution.width,
        shader.resolution.height,
      ];
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse[0] = Math.min(1, e.clientX / window.innerWidth);
      mouse[1] = Math.min(1, e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMouseMove);

    const startTime = performance.now();
    let rafId: number;

    const loop = () => {
      const time = (performance.now() - startTime) / 1000;

      for (const [shaderId, fieldDefs] of Object.entries(defs)) {
        const res = resolutionMap[shaderId] ?? [1, 1];
        const scope = {
          time,
          mouse: { x: mouse[0], y: mouse[1] },
          resolution: { x: res[0], y: res[1] },
        };
        uniformRef.current[shaderId] ??= {};
        for (const [fieldName, def] of Object.entries(fieldDefs)) {
          if (typeof def === "string") {
            try {
              const result = math.evaluate(def, scope);
              if (typeof result === "number")
                uniformRef.current[shaderId][fieldName] = result;
            } catch {
              /* invalid expression */
            }
          } else if (Array.isArray(def)) {
            const current = uniformRef.current[shaderId][fieldName];
            const arr: number[] = Array.isArray(current)
              ? [...current]
              : (def as any[]).map(() => 0);
            for (let i = 0; i < def.length; i++) {
              const slot = (def as any[])[i];
              if (typeof slot === "string") {
                try {
                  const result = math.evaluate(slot, scope);
                  if (typeof result === "number") arr[i] = result;
                } catch {
                  /* invalid expression */
                }
              } else if (typeof slot === "number") {
                arr[i] = slot;
              }
            }
            uniformRef.current[shaderId][fieldName] = arr;
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <RendererComponent
      patch={getPatch()}
      uniforms={uniformRef}
      animate={true}
      width={
        100
        // final patch width
      }
      height={
        100
        // final patch height
      }
    />
  );
}

export default SequenzaComponent;

function getInitialUniforms(): Record<string, Uniforms> {
  throw new Error("placeholder for initial uniforms");
}

function getPatch(): Patch {
  throw new Error("placeholder for patch");
}

function getUniformDefs(): Record<string, Uniforms> {
  throw new Error("placeholder for uniform defs");
}
