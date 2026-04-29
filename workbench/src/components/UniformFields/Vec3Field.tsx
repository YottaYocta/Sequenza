import { type FC } from "react";
import type { Field } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ColorPickerButton, ExpressionChip, ResetButton, vec3ToHex, hexToVec3 } from "./shared";

export const Vec3Field: FC<{
  field: Field & { type: "vec3" };
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  def?: (string | null)[];
  onSetDef?: (index: number, expr: string | null) => void;
}> = ({ field, value, onChange, def, onSetDef }) => {
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number, number];
    next[i] = v;
    onChange(next);
  };

  const allExpr = def?.every((d) => d !== null);

  return (
    <div className="flex items-center">
      <div className="flex flex-col gap-2">
        {(["x", "y", "z"] as const).map((axis, i) =>
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

export const Vec3ColorField: FC<{
  field: Field & { type: "vec3" };
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
}> = ({ field, value, onChange }) => {
  return (
    <div className="flex items-center">
      <ColorPickerButton
        color={vec3ToHex(value)}
        onChange={(hex) => onChange(hexToVec3(hex))}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => onChange(field.default!)} />
      )}
    </div>
  );
};
