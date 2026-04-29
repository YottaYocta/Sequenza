import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ExpressionChip, ResetButton } from "./shared";

export const FloatField: FC<{
  field: Field & { type: "float" };
  value: number;
  onChange: (value: number) => void;
  def?: string;
  onSetDef?: (expr: string | null) => void;
}> = ({ field, value, onChange, def, onSetDef }) => {
  if (def !== undefined) {
    return <ExpressionChip expr={def} onEdit={onSetDef ?? (() => {})} />;
  }
  return (
    <div className="flex items-center">
      <Scrubber
        value={value}
        min={field.min}
        max={field.max}
        step={0.01}
        onChange={onChange}
        onExprInput={onSetDef}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => onChange(field.default!)} />
      )}
    </div>
  );
};
