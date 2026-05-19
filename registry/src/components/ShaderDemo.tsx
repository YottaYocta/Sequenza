import {
  RendererComponent,
  extractFields,
  type Uniforms,
  type Patch,
} from "@sequenza/lib";
import "@sequenza/lib/style.css";
import { buildEditorState, type EditorInitialState } from "@sequenza/workbench";
import { create, all } from "mathjs";
import { useEffect, useRef, useState } from "react";

const math = create(all);

type UniformExpressions = Record<string, Record<string, string | (string | null)[] | null>>;

interface ShaderDemoProps {
  patch: Patch;
  initialUniforms: Record<string, Uniforms>;
  initialUniformExpressions?: UniformExpressions;
  width: number;
  height: number;
  className?: string;
  handleEdit?: (initialState: EditorInitialState) => void;
  animate?: boolean;
}

export function ShaderDemo({
  patch,
  initialUniforms,
  initialUniformExpressions,
  width,
  height,
  className,
  handleEdit,
  animate,
}: ShaderDemoProps) {
  const uniformRef = useRef<Record<string, Uniforms>>(
    JSON.parse(JSON.stringify(initialUniforms)),
  );

  const motionRef = useRef({
    lerpSpeed: 0.12,
    tiltSensitivity: 0.63,
    spinSensitivity: 0.2,
    maxTilt: 2,
    maxSpin: 30,
    perspective: 30,
    stopDelay: 200,
  });

  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const labelRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const lerpRafRef = useRef<number | undefined>(undefined);
  const lerpStopTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [hovering, setHovering] = useState<boolean>(false);
  const hoveringRef = useRef(false);
  const mouseRef = useRef<[number, number]>([0, 0]);

  const startLerp = () => {
    stopLerp();
    const tick = () => {
      const {
        lerpSpeed,
        tiltSensitivity,
        spinSensitivity,
        maxTilt,
        maxSpin,
        perspective,
      } = motionRef.current;
      const t = targetPos.current;
      const c = currentPos.current;
      const velX = t.x - c.x;
      const velY = t.y - c.y;
      c.x += velX * lerpSpeed;
      c.y += velY * lerpSpeed;
      if (labelRef.current) {
        labelRef.current.style.left = `${c.x}px`;
        labelRef.current.style.top = `${c.y}px`;
      }
      if (tiltRef.current) {
        const rotY = Math.max(
          -maxTilt,
          Math.min(maxTilt, velX * tiltSensitivity),
        );
        const rotX = Math.max(
          -maxTilt,
          Math.min(maxTilt, -velY * tiltSensitivity),
        );
        const rotZ = Math.max(
          -maxSpin,
          Math.min(maxSpin, velX * spinSensitivity),
        );
        tiltRef.current.style.transform = `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
      }
      lerpRafRef.current = requestAnimationFrame(tick);
    };
    lerpRafRef.current = requestAnimationFrame(tick);
  };

  const stopLerp = () => {
    if (lerpRafRef.current !== undefined) {
      cancelAnimationFrame(lerpRafRef.current);
      lerpRafRef.current = undefined;
    }
  };

  useEffect(() => {
    const defs: Record<string, Record<string, unknown>> = {};
    const resolutionMap: Record<string, [number, number]> = {};

    for (const shader of patch.shaders) {
      resolutionMap[shader.id] = [
        shader.resolution.width,
        shader.resolution.height,
      ];
      const fields = extractFields(shader);
      for (const field of fields) {
        if ("defaultExpr" in field && field.defaultExpr != null) {
          defs[shader.id] ??= {};
          defs[shader.id][field.name] = field.defaultExpr;
        }
      }
      if (initialUniformExpressions?.[shader.id]) {
        defs[shader.id] ??= {};
        for (const [name, expr] of Object.entries(initialUniformExpressions[shader.id])) {
          if (expr != null) defs[shader.id][name] = expr;
        }
      }
    }

    let cumulativeTime = 0;
    let lastFrameTime = performance.now();

    const loop = () => {
      const now = performance.now();
      if (hoveringRef.current) {
        cumulativeTime += (now - lastFrameTime) / 1000;
      }
      lastFrameTime = now;

      for (const [shaderId, fieldDefs] of Object.entries(defs)) {
        const res = resolutionMap[shaderId] ?? [1, 1];
        const scope = {
          time: cumulativeTime,
          mouse: { x: mouseRef.current[0], y: mouseRef.current[1] },
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
              : (def as unknown[]).map(() => 0);
            for (let i = 0; i < def.length; i++) {
              const slot = (def as unknown[])[i];
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

    let rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(lerpStopTimeout.current);
      stopLerp();
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full group overflow-clip ${className ?? "rounded-md"}`}
      onMouseEnter={(e) => {
        clearTimeout(lerpStopTimeout.current);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        targetPos.current = { x, y };
        currentPos.current = { x, y };
        startLerp();
        hoveringRef.current = true;
        setHovering(true);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        targetPos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        mouseRef.current[0] = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        mouseRef.current[1] = Math.max(
          0,
          Math.min(1, (e.clientY - rect.top) / rect.height),
        );
      }}
      onMouseLeave={() => {
        lerpStopTimeout.current = setTimeout(
          stopLerp,
          motionRef.current.stopDelay,
        );
        hoveringRef.current = false;
        setHovering(false);
      }}
    >
      <RendererComponent
        patch={patch}
        uniforms={uniformRef}
        animate={animate !== undefined ? animate : hovering}
        width={width}
        height={height}
        className="w-full h-full object-fill"
      />
      {handleEdit && (
        <>
          <button
            className="focus:opacity-100 group-hover:opacity-100 opacity-0 px-5 py-1 rounded-sm bg-neutral-900 text-white group-hover:transition-opacity duration-200 ease-out hover:cursor-pointer absolute right-2 bottom-2 max-md:opacity-100"
            onClick={() => handleEdit(buildEditorState(patch, initialUniforms, { x: 0, y: 0 }, initialUniformExpressions))}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}
