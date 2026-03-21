import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ColorPickerButton, ResetButton, vec3ToHex, hexToVec3 } from "./shared";

export const Vec3Field: FC<{
  field: Field & { type: "vec3" };
  value: [number, number, number];
  handleUpdateUniformField: (value: [number, number, number]) => void;
}> = ({ field, value, handleUpdateUniformField }) => {
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number, number];
    next[i] = v;
    handleUpdateUniformField(next);
  };
  return (
    <div className="flex items-center ">
      <div className="flex flex-col gap-2">
        {(["x", "y", "z"] as const).map((axis, i) => (
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

export const Vec3ColorField: FC<{
  field: Field & { type: "vec3" };
  value: [number, number, number];
  handleUpdateUniformField: (value: [number, number, number]) => void;
}> = ({ field, value, handleUpdateUniformField }) => {
  return (
    <div className="flex items-center ">
      <ColorPickerButton
        color={vec3ToHex(value)}
        onChange={(hex) => handleUpdateUniformField(hexToVec3(hex))}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => handleUpdateUniformField(field.default!)} />
      )}
    </div>
  );
};
