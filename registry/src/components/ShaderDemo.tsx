import {
  RendererComponent,
  extractFields,
  type Uniforms,
  type Patch,
} from "@sequenza/lib";
import { buildEditorState, type EditorInitialState } from "@sequenza/workbench";
import "@sequenza/lib/style.css";
import { useEffect, useRef, useState } from "react";

interface ShaderDemoProps {
  patch: Patch;
  initialUniforms: Record<string, Uniforms>;
  width: number;
  height: number;
  className?: string;
  handleEdit?: (initialState: EditorInitialState) => void;
  animate?: boolean;
}

export function ShaderDemo({
  patch,
  initialUniforms,
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
    const timeFields: Array<{ shaderId: string; fieldName: string }> = [];
    const mouseFields: Array<{ shaderId: string; fieldName: string }> = [];

    for (const shader of patch.shaders) {
      const fields = extractFields(shader);
      for (const field of fields) {
        if (field.type === "float" && field.defaultExpr === "time") {
          timeFields.push({ shaderId: shader.id, fieldName: field.name });
        } else if (
          field.type === "vec2" &&
          Array.isArray(field.defaultExpr) &&
          field.defaultExpr[0] === "mouse.x"
        ) {
          mouseFields.push({ shaderId: shader.id, fieldName: field.name });
        } else if (
          field.type === "vec2" &&
          Array.isArray(field.defaultExpr) &&
          field.defaultExpr[0] === "resolution.x"
        ) {
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
      let cumulativeTime = 0;
      let lastFrameTime = performance.now();
      const loop = () => {
        const now = performance.now();
        if (hoveringRef.current) {
          cumulativeTime += (now - lastFrameTime) / 1000;
        }
        lastFrameTime = now;
        for (const { shaderId, fieldName } of timeFields) {
          uniformRef.current[shaderId] ??= {};
          uniformRef.current[shaderId][fieldName] = cumulativeTime;
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      if (onMouseMove) window.removeEventListener("mousemove", onMouseMove);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      clearTimeout(lerpStopTimeout.current);
      stopLerp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        className="w-full h-full"
      />
      {handleEdit && (
        <div
          ref={labelRef}
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
        >
          <div ref={tiltRef}>
            <button
              className="opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 focus:opacity-100 focus:scale-100 pointer-events-none group-hover:pointer-events-auto focus:pointer-events-auto px-5 py-2 text-lg font-semibold  rounded-md bg-neutral-900 text-white transition-[transform, opacity] duration-200 ease-out hover:cursor-pointer border-neutral-100  border-2"
              onClick={() =>
                handleEdit(buildEditorState(patch, initialUniforms))
              }
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
