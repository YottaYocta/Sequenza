import { useState, useEffect, useContext, type FC } from "react";
import type { Field } from "@sequenza/lib";
import { EditorContext } from "../EditorContext";

export const MouseField: FC<{
  field: Field & { type: "vec2"; special: "mouse" };
  handleUpdateUniformField: (value: [number, number]) => void;
}> = ({ handleUpdateUniformField }) => {
  const { mousePosition } = useContext(EditorContext);
  const [pos, setPos] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const p: [number, number] = [mousePosition.current[0], mousePosition.current[1]];
      setPos(p);
      handleUpdateUniformField(p);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [handleUpdateUniformField]);

  return (
    <div className="flex items-center ">
      <div className="flex gap-2 flex-col">
        {(["x", "y"] as const).map((axis, i) => (
          <div key={axis} className="flex items-center w-20 relative">
            <span className="absolute left-1 z-10 bg-neutral-200 h-4 w-4 grid place-items-center pointer-events-none rounded-sm">
              <p className="text-[11px] font-mono w-3 text-neutral-500 leading-0 -translate-y-0.5 translate-x-0.5">
                {axis}
              </p>
            </span>
            <span className="text-xs font-mono text-neutral-500 pl-5 pointer-events-none bg-neutral-100 rounded-sm w-full h-6 flex items-center justify-end px-1 tabular-nums">
              {pos[i].toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
