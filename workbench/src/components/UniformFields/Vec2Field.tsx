import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ExpressionChip, ResetButton } from "./shared";

export const Vec2Field: FC<{
  field: Field & { type: "vec2" };
  value: [number, number];
  onChange: (value: [number, number]) => void;
  def?: (string | null)[];
  onSetDef?: (index: number, expr: string | null) => void;
}> = ({ field, value, onChange, def, onSetDef }) => {
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number];
    next[i] = v;
    onChange(next);
  };

  const allExpr = def?.every((d) => d !== null);

  return (
    <div className="flex items-center">
      <div className="flex gap-2 flex-wrap flex-col">
        {(["x", "y"] as const).map((axis, i) =>
          def?.[i] != null ? (
            <ExpressionChip
              key={axis}
              label={axis}
              expr={def[i] as string}
              onEdit={(e) => onSetDef?.(i, e)}
            />
          ) : (
            <Scrubber
              key={axis}
              label={axis}
              value={value[i]}
              onChange={(v) => update(i, v)}
              onExprInput={(e) => onSetDef?.(i, e)}
            />
          ),
        )}
      </div>
      {!allExpr && field.default !== undefined && (
        <ResetButton onClick={() => onChange(field.default!)} />
      )}
    </div>
  );
};
