import { useRef, useEffect, type FC } from "react";
import type { Field } from "@sequenza/lib";

export const ResolutionField: FC<{
  field: Field & { type: "vec2"; special: "resolution" };
  width: number;
  height: number;
  handleUpdateUniformField: (value: [number, number]) => void;
}> = ({ width, height, handleUpdateUniformField }) => {
  const handleRef = useRef(handleUpdateUniformField);
  handleRef.current = handleUpdateUniformField;

  useEffect(() => {
    handleRef.current([width, height]);
  }, [width, height]);

  return (
    <div className="flex items-center ">
      <div className="flex gap-2 flex-col">
        {(["w", "h"] as const).map((axis, i) => (
          <div key={axis} className="flex items-center w-20 relative">
            <span className="absolute left-1 z-10 bg-neutral-200 h-4 w-4 grid place-items-center pointer-events-none rounded-sm">
              <p className="text-[11px] font-mono w-3 text-neutral-500 leading-0 -translate-y-0.5 translate-x-0.5">
                {axis}
              </p>
            </span>
            <span className="text-xs font-mono text-neutral-500 pl-5 pointer-events-none bg-neutral-100 rounded-sm w-full h-6 flex items-center justify-end px-1 tabular-nums">
              {i === 0 ? width : height}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
