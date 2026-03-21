import { useState, useEffect, type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ResetButton } from "./shared";

export const FloatField: FC<{
  field: Field & { type: "float" };
  initialValue: number;
  handleUpdateUniformField: (value: number) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
    handleUpdateUniformField(initialValue);
  }, [initialValue]);

  const update = (v: number) => {
    setValue(v);
    handleUpdateUniformField(v);
  };

  return (
    <div className="flex items-center ">
      <Scrubber
        value={value}
        min={field.min}
        max={field.max}
        step={0.01}
        onChange={update}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => update(field.default!)} />
      )}
    </div>
  );
};
