import { useMemo, type FC, type ReactNode } from "react";
import type {
  Shader,
  TextureUniform,
  GradientUniform,
  Uniforms,
} from "@sequenza/lib";
import { extractFields, getFieldDefault, type Field } from "@sequenza/lib";
import { FieldLabel } from "./UniformFields/shared";
import { FloatField } from "./UniformFields/FloatField";
import { Vec2Field } from "./UniformFields/Vec2Field";
import { Vec3Field, Vec3ColorField } from "./UniformFields/Vec3Field";
import { Vec4Field, Vec4ColorField } from "./UniformFields/Vec4Field";
import { ImageUploadField } from "./UniformFields/ImageUploadField";
import { GradientField } from "./UniformFields/GradientField";

interface UniformFormProps {
  shader: Shader;
  savedUniforms: Uniforms;
  uniformDefs: Uniforms;
  handleUpdateUniform: (fieldName: string, value: any) => void;
  handleUpdateUniformDef?: (
    fieldName: string,
    slotIndex: number | null,
    value: string | null,
    fieldLength?: number,
  ) => void;
}

function toVecDef(raw: any): (string | null)[] | undefined {
  return Array.isArray(raw)
    ? (raw as (string | number)[]).map((s) => (typeof s === "string" ? s : null))
    : undefined;
}

function fieldLabelType(field: Field): string {
  switch (field.type) {
    case "float":
      return "float";
    case "vec2":
      return "vec2";
    case "vec3":
      return field.color ? "vec3 color" : "vec3";
    case "vec4":
      return field.color ? "vec4 color" : "vec4";
    case "sampler2D":
      return field.source === "gradient"
        ? "sampler2D gradient"
        : "sampler2D texture";
  }
}

const UniformForm: FC<UniformFormProps> = ({
  shader,
  savedUniforms,
  uniformDefs,
  handleUpdateUniform,
  handleUpdateUniformDef,
}) => {
  const fields = useMemo(() => extractFields(shader), [shader.source]);
  if (
    fields.filter((field) => {
      return !(field.type === "sampler2D" && field.source === "input");
    }).length === 0
  ) {
    return <></>;
  }

  return (
    <div className="rounded flex flex-col gap-1">
      {fields.map((field) => {
        const key = `${field.name}-${field.type}`;
        const update = (newValue: any) =>
          handleUpdateUniform(field.name, newValue);

        const updateTexture = (newValue: TextureUniform | null) => {
          handleUpdateUniform(field.name, newValue);
        };

        const saved = savedUniforms[field.name];
        const fallback = getFieldDefault(field);
        const rawDef = uniformDefs[field.name];

        const vecOnSetDef = (len: number) =>
          handleUpdateUniformDef
            ? (index: number, expr: string | null) =>
                handleUpdateUniformDef(field.name, index, expr, len)
            : undefined;

        let control: ReactNode = null;
        switch (field.type) {
          case "float": {
            const def = typeof rawDef === "string" ? rawDef : undefined;
            const onSetDef = handleUpdateUniformDef
              ? (expr: string | null) =>
                  handleUpdateUniformDef(field.name, null, expr)
              : undefined;
            control = (
              <FloatField
                field={field}
                value={(saved as number) ?? (fallback as number)}
                onChange={update}
                def={def}
                onSetDef={onSetDef}
              />
            );
            break;
          }
          case "vec2": {
            control = (
              <Vec2Field
                field={field}
                value={
                  (saved as [number, number]) ?? (fallback as [number, number])
                }
                onChange={update}
                def={toVecDef(rawDef)}
                onSetDef={vecOnSetDef(2)}
              />
            );
            break;
          }
          case "vec3": {
            const def = toVecDef(rawDef);
            const onSetDef = vecOnSetDef(3);
            control = field.color ? (
              <Vec3ColorField
                field={field}
                value={
                  (saved as [number, number, number]) ??
                  (fallback as [number, number, number])
                }
                onChange={update}
              />
            ) : (
              <Vec3Field
                field={field}
                value={
                  (saved as [number, number, number]) ??
                  (fallback as [number, number, number])
                }
                onChange={update}
                def={def}
                onSetDef={onSetDef}
              />
            );
            break;
          }
          case "vec4": {
            const def = toVecDef(rawDef);
            const onSetDef = vecOnSetDef(4);
            control = field.color ? (
              <Vec4ColorField
                field={field}
                value={
                  (saved as [number, number, number, number]) ??
                  (fallback as [number, number, number, number])
                }
                onChange={update}
              />
            ) : (
              <Vec4Field
                field={field}
                value={
                  (saved as [number, number, number, number]) ??
                  (fallback as [number, number, number, number])
                }
                onChange={update}
                def={def}
                onSetDef={onSetDef}
              />
            );
            break;
          }
          case "sampler2D":
            if (field.source === "texture")
              control = (
                <ImageUploadField
                  field={field}
                  value={saved as TextureUniform | undefined}
                  handleUpdateUniformField={updateTexture}
                />
              );
            else if (field.source === "gradient")
              control = (
                <GradientField
                  field={
                    field as Field & { type: "sampler2D"; source: "gradient" }
                  }
                  value={saved as GradientUniform | undefined}
                  handleUpdateUniformField={update}
                />
              );
            break;
        }

        if (control === null) return null;
        return (
          <div key={key} className="flex items-center gap-4 rounded-sm mb-1">
            <FieldLabel name={field.name} type={fieldLabelType(field)} />
            <div className="bg-neutral-100 p-1 rounded-md">{control}</div>
          </div>
        );
      })}
    </div>
  );
};

export default UniformForm;
