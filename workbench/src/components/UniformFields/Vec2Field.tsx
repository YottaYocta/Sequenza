import { useState, useEffect, type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ResetButton } from "./shared";

export const Vec2Field: FC<{
  field: Field & { type: "vec2" };
  initialValue: [number, number];
  handleUpdateUniformField: (value: [number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
    handleUpdateUniformField(initialValue);
  }, [initialValue]);

  const update = (i: number, v: number) => {
    const next = [...value] as [number, number];
    next[i] = v;
    setValue(next);
    handleUpdateUniformField(next);
  };

  const reset = (v: [number, number]) => {
    setValue(v);
    handleUpdateUniformField(v);
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
        <ResetButton onClick={() => reset(field.default!)} />
      )}
    </div>
  );
};
