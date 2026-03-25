import { useState, useEffect, type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ColorPickerButton, ResetButton, vec3ToHex, hexToVec3 } from "./shared";

export const Vec4Field: FC<{
  field: Field & { type: "vec4" };
  initialValue: [number, number, number, number];
  handleUpdateUniformField: (value: [number, number, number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
    handleUpdateUniformField(initialValue);
  }, [initialValue]);

  const update = (i: number, v: number) => {
    const next = [...value] as [number, number, number, number];
    next[i] = v;
    setValue(next);
    handleUpdateUniformField(next);
  };

  const reset = (v: [number, number, number, number]) => {
    setValue(v);
    handleUpdateUniformField(v);
  };

  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex flex-col gap-2">
        {(["x", "y", "z", "w"] as const).map((axis, i) => (
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

export const Vec4ColorField: FC<{
  field: Field & { type: "vec4" };
  initialValue: [number, number, number, number];
  handleUpdateUniformField: (value: [number, number, number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
    handleUpdateUniformField(initialValue);
  }, [initialValue]);

  const [r, g, b, a] = value;

  const update = (v: [number, number, number, number]) => {
    setValue(v);
    handleUpdateUniformField(v);
  };

  return (
    <div className="flex items-center ">
      <ColorPickerButton
        color={vec3ToHex([r, g, b])}
        onChange={(hex) => {
          const [nr, ng, nb] = hexToVec3(hex);
          update([nr, ng, nb, a]);
        }}
      />
      <Scrubber
        label="a"
        value={a}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => update([r, g, b, v])}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => update(field.default!)} />
      )}
    </div>
  );
};
