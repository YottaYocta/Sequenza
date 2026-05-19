import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { type Shader, type Uniforms } from "@sequenza/lib";
import { evalExpression, type EvalContext } from "../lib/evalExpression";
import type { UniformExpressions } from "../components/EditorContext";

export function useUniformAnimation({
  shaderMap,
  uniformRef,
  uniformExpressions,
}: {
  shaderMap: Record<string, Shader>;
  uniformRef: RefObject<Record<string, Uniforms>>;
  uniformExpressions: UniformExpressions;
}) {
  const [playing, setPlaying] = useState(false);
  const elapsedRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const mousePosRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current = [
        Math.min(1, e.clientX / window.innerWidth),
        Math.min(1, e.clientY / window.innerHeight),
      ];
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const resetTime = useCallback(() => {
    elapsedRef.current = 0;
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (playing) {
      startRef.current = performance.now() - elapsedRef.current * 1000;
    }
    let rafId: number;
    const tick = () => {
      if (playing && startRef.current !== null) {
        elapsedRef.current = (performance.now() - startRef.current) / 1000;
      }
      for (const [nodeId, fieldDefs] of Object.entries(uniformExpressions)) {
        if (!uniformRef.current[nodeId]) uniformRef.current[nodeId] = {};
        const shader = shaderMap[nodeId];
        const resolution: [number, number] = shader
          ? [shader.resolution.width, shader.resolution.height]
          : [1, 1];
        const ctx: EvalContext = {
          time: elapsedRef.current,
          mouse: mousePosRef.current,
          resolution,
        };
        for (const [fieldName, def] of Object.entries(fieldDefs)) {
          if (typeof def === "string") {
            const resolved = evalExpression(def, ctx);
            if (resolved !== null)
              uniformRef.current[nodeId][fieldName] = resolved;
          } else if (
            Array.isArray(def) &&
            (def as (number | string)[]).some((s) => typeof s === "string")
          ) {
            const current = uniformRef.current[nodeId][fieldName];
            const arr: number[] = Array.isArray(current)
              ? [...current]
              : (def as (number | string)[]).map(() => 0);
            for (let i = 0; i < def.length; i++) {
              const slot = (def as (number | string)[])[i];
              if (typeof slot === "string") {
                const resolved = evalExpression(slot, ctx);
                if (resolved !== null) arr[i] = resolved;
              } else if (typeof slot === "number") {
                arr[i] = slot;
              }
            }
            uniformRef.current[nodeId][fieldName] = arr;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, shaderMap, uniformExpressions]);

  return {
    playing,
    setPlaying,
    resetTime,
    elapsedRef,
    mousePosition: mousePosRef,
  };
}
