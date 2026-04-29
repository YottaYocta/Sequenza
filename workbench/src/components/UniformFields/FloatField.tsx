import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ResetButton } from "./shared";

export const FloatField: FC<{
  field: Field & { type: "float" };
  value: number;
  onChange: (value: number) => void;
}> = ({ field, value, onChange }) => {
  return (
    <div className="flex items-center ">
      <Scrubber
        value={value}
        min={field.min}
        max={field.max}
        step={0.01}
        onChange={onChange}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => onChange(field.default!)} />
      )}
    </div>
  );
};
