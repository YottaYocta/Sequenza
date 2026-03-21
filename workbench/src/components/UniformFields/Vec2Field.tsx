import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ResetButton } from "./shared";

export const Vec2Field: FC<{
  field: Field & { type: "vec2" };
  value: [number, number];
  handleUpdateUniformField: (value: [number, number]) => void;
}> = ({ field, value, handleUpdateUniformField }) => {
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number];
    next[i] = v;
    handleUpdateUniformField(next);
  };
  return (
    <div className="flex items-center ">
      <div className="flex gap-2 flex-wrap flex-col">
        {(["x", "y"] as const).map((axis, i) => (
          <Scrubber
            key={axis}
            label={axis}
            value={value[i]}
            onChange={(v) => update(i, v)}
          />
        ))}
      </div>
      {field.default !== undefined && (
        <ResetButton onClick={() => handleUpdateUniformField(field.default!)} />
      )}
    </div>
  );
};
