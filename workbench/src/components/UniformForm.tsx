import { useMemo, type FC, type ReactNode } from "react";
import type {
  Shader,
  TextureUniform,
  GradientUniform,
  Uniforms,
} from "@sequenza/lib";
import { extractFields, type Field } from "@sequenza/lib";
import { FieldLabel } from "./UniformFields/shared";
import { FloatField } from "./UniformFields/FloatField";
import { TimeField } from "./UniformFields/TimeField";
import { Vec2Field } from "./UniformFields/Vec2Field";
import { Vec3Field, Vec3ColorField } from "./UniformFields/Vec3Field";
import { Vec4Field, Vec4ColorField } from "./UniformFields/Vec4Field";
import { MouseField } from "./UniformFields/MouseField";
import { ResolutionField } from "./UniformFields/ResolutionField";
import { ImageUploadField } from "./UniformFields/ImageUploadField";
import { GradientField } from "./UniformFields/GradientField";

interface UniformFormProps {
  shader: Shader;
  uniforms: Uniforms;
  handleUpdateUniform: (
    uniformCallback: (snapshot: Uniforms) => Uniforms,
  ) => void;
}

function fieldLabelType(field: Field): string {
  switch (field.type) {
    case "float":
      return field.special === "time" ? "float time" : "float";
    case "vec2":
      return field.special === "mouse"
        ? "vec2 mouse"
        : field.special === "resolution"
          ? "vec2 resolution"
          : "vec2";
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
  uniforms,
  handleUpdateUniform,
}) => {
  const fields = useMemo(() => extractFields(shader), [shader.source]);
  if (fields.length === 0) {
    return (
      <p className="px-2 py-3 font-mono text-xs">
        No uniforms found.{" "}
        <span>
          Add <code className="">// [min, max, default]</code> comments to float
          uniforms.
        </span>
      </p>
    );
  }

  return (
    <div className="rounded flex flex-col gap-1">
      {fields.map((field) => {
        const key = `${field.name}-${field.type}`;
        const update = (newValue: any) =>
          handleUpdateUniform((snapshot) => ({
            ...snapshot,
            [field.name]: newValue,
          }));

        const updateTexture = (newValue: TextureUniform | null) => {
          handleUpdateUniform((snapshot) => {
            const next = { ...snapshot };
            if (newValue === null) delete next[field.name];
            else next[field.name] = newValue;
            return next
          });
        };

        let control: ReactNode = null;
        switch (field.type) {
          case "float":
            control =
              field.special === "time" ? (
                <TimeField
                  field={field as Field & { type: "float"; special: "time" }}
                  handleUpdateUniformField={update}
                />
              ) : (
                <FloatField
                  field={field}
                  value={(uniforms[field.name] as number) ?? field.default ?? 0}
                  handleUpdateUniformField={update}
                />
              );
            break;
          case "vec2":
            control =
              field.special === "mouse" ? (
                <MouseField
                  field={field as Field & { type: "vec2"; special: "mouse" }}
                  handleUpdateUniformField={update}
                />
              ) : field.special === "resolution" ? (
                <ResolutionField
                  field={
                    field as Field & { type: "vec2"; special: "resolution" }
                  }
                  width={shader.resolution.width}
                  height={shader.resolution.height}
                  handleUpdateUniformField={update}
                />
              ) : (
                <Vec2Field
                  field={field}
                  value={
                    (uniforms[field.name] as [number, number]) ??
                    field.default ?? [0, 0]
                  }
                  handleUpdateUniformField={update}
                />
              );
            break;
          case "vec3":
            control = field.color ? (
              <Vec3ColorField
                field={field}
                value={
                  (uniforms[field.name] as [number, number, number]) ??
                  field.default ?? [1, 1, 1]
                }
                handleUpdateUniformField={update}
              />
            ) : (
              <Vec3Field
                field={field}
                value={
                  (uniforms[field.name] as [number, number, number]) ??
                  field.default ?? [0, 0, 0]
                }
                handleUpdateUniformField={update}
              />
            );
            break;
          case "vec4":
            control = field.color ? (
              <Vec4ColorField
                field={field}
                value={
                  (uniforms[field.name] as [number, number, number, number]) ??
                  field.default ?? [1, 1, 1, 1]
                }
                handleUpdateUniformField={update}
              />
            ) : (
              <Vec4Field
                field={field}
                value={
                  (uniforms[field.name] as [number, number, number, number]) ??
                  field.default ?? [0, 0, 0, 0]
                }
                handleUpdateUniformField={update}
              />
            );
            break;
          case "sampler2D":
            if (field.source === "texture")
              control = (
                <ImageUploadField
                  field={field}
                  value={uniforms[field.name] as TextureUniform | undefined}
                  handleUpdateUniformField={updateTexture}
                />
              );
            else if (field.source === "gradient")
              control = (
                <GradientField
                  field={
                    field as Field & { type: "sampler2D"; source: "gradient" }
                  }
                  value={uniforms[field.name] as GradientUniform | undefined}
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
