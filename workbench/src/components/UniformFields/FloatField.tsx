import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ResetButton } from "./shared";

export const FloatField: FC<{
  field: Field & { type: "float" };
  value: number;
  handleUpdateUniformField: (value: number) => void;
}> = ({ field, value, handleUpdateUniformField }) => {
  return (
    <div className="flex items-center ">
      <Scrubber
        value={value}
        min={field.min}
        max={field.max}
        step={0.01}
        onChange={(val) => {
          handleUpdateUniformField(val);
        }}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => handleUpdateUniformField(field.default!)} />
      )}
    </div>
  );
};
