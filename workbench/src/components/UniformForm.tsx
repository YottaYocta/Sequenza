import {
  useState,
  useRef,
  useEffect,
  useContext,
  useMemo,
  type FC,
} from "react";
import type { Shader, TextureUniform, Uniforms } from "@sequenza/lib";
import { Scrubber } from "./Scrubber";
import { EditorContext } from "./EditorContext";
import { extractFields, type Field } from "@sequenza/lib";

interface UniformFormProps {
  shader: Shader;
  initialUniforms?: Uniforms;
  handleUpdateUniform: (uniforms: Uniforms) => void;
}

const toHex = (v: number) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, "0");
const fromHex = (h: string) => parseInt(h, 16) / 255;
const vec3ToHex = ([r, g, b]: [number, number, number]) =>
  `#${toHex(r)}${toHex(g)}${toHex(b)}`;
const hexToVec3 = (hex: string): [number, number, number] => [
  fromHex(hex.slice(1, 3)),
  fromHex(hex.slice(3, 5)),
  fromHex(hex.slice(5, 7)),
];

const ColorPickerButton: FC<{
  color: string;
  onChange: (hex: string) => void;
}> = ({ color, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-8 h-5.5 rounded border border-neutral-500 cursor-pointer"
        style={{ backgroundColor: color }}
        title={color}
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />
    </div>
  );
};

const ResetButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-xs text-neutral-600 hover:text-neutral-400 font-mono leading-none select-none px-2"
    title="Reset to default"
  >
    R
  </button>
);

const FieldLabel: FC<{ name: string; type: string }> = ({ name, type }) => (
  <div className="min-w-30 flex flex-col gap-0.5">
    <span className="font-mono text-xs text-neutral-900">{name}</span>
    <span className="font-mono text-[10px] text-neutral-500">{type}</span>
  </div>
);

const FloatFieldComponent: FC<{
  field: Field & { type: "float" };
  initialValue?: number;
  handleUpdateUniformField: (value: number) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState(initialValue ?? field.default ?? 0);
  const update = (v: number) => {
    setValue(v);
    handleUpdateUniformField(v);
  };
  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="float" />
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

const Vec2FieldComponent: FC<{
  field: Field & { type: "vec2" };
  initialValue?: [number, number];
  handleUpdateUniformField: (value: [number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState<[number, number]>(
    initialValue ?? field.default ?? [0, 0],
  );
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number];
    next[i] = v;
    setValue(next);
    handleUpdateUniformField(next);
  };
  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="vec2" />
      <div className="flex gap-2 flex-wrap">
        {(["x", "y"] as const).map((axis, i) => (
          <Scrubber
            key={axis}
            label={axis}
            value={value[i]}
            onChange={(v) => update(i, v)}
          />
        ))}
      </div>
      {field.default !== undefined && (
        <ResetButton
          onClick={() => {
            setValue(field.default!);
            handleUpdateUniformField(field.default!);
          }}
        />
      )}
    </div>
  );
};

const Vec3ColorFieldComponent: FC<{
  field: Field & { type: "vec3" };
  initialValue?: [number, number, number];
  handleUpdateUniformField: (value: [number, number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState<[number, number, number]>(
    initialValue ?? field.default ?? [1, 1, 1],
  );
  const update = (v: [number, number, number]) => {
    setValue(v);
    handleUpdateUniformField(v);
  };
  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="vec3 color" />
      <ColorPickerButton
        color={vec3ToHex(value)}
        onChange={(hex) => update(hexToVec3(hex))}
      />
      {field.default !== undefined && (
        <ResetButton onClick={() => update(field.default!)} />
      )}
    </div>
  );
};

const Vec4ColorFieldComponent: FC<{
  field: Field & { type: "vec4" };
  initialValue?: [number, number, number, number];
  handleUpdateUniformField: (value: [number, number, number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState<[number, number, number, number]>(
    initialValue ?? field.default ?? [1, 1, 1, 1],
  );
  const [r, g, b, a] = value;
  const update = (v: [number, number, number, number]) => {
    setValue(v);
    handleUpdateUniformField(v);
  };
  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="vec4 color" />
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

const Vec3FieldComponent: FC<{
  field: Field & { type: "vec3" };
  initialValue?: [number, number, number];
  handleUpdateUniformField: (value: [number, number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState<[number, number, number]>(
    initialValue ?? field.default ?? [0, 0, 0],
  );
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number, number];
    next[i] = v;
    setValue(next);
    handleUpdateUniformField(next);
  };
  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="vec3" />
      <div className="flex gap-2 flex-wrap">
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
        <ResetButton
          onClick={() => {
            setValue(field.default!);
            handleUpdateUniformField(field.default!);
          }}
        />
      )}
    </div>
  );
};

const Vec4FieldComponent: FC<{
  field: Field & { type: "vec4" };
  initialValue?: [number, number, number, number];
  handleUpdateUniformField: (value: [number, number, number, number]) => void;
}> = ({ field, initialValue, handleUpdateUniformField }) => {
  const [value, setValue] = useState<[number, number, number, number]>(
    initialValue ?? field.default ?? [0, 0, 0, 0],
  );
  const update = (i: number, v: number) => {
    const next = [...value] as [number, number, number, number];
    next[i] = v;
    setValue(next);
    handleUpdateUniformField(next);
  };
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <FieldLabel name={field.name} type="vec4" />
      <div className="flex gap-2 flex-wrap">
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
        <ResetButton
          onClick={() => {
            setValue(field.default!);
            handleUpdateUniformField(field.default!);
          }}
        />
      )}
    </div>
  );
};

const TimeFieldComponent: FC<{
  field: Field & { type: "float"; special: "time" };
  handleUpdateUniformField: (value: number) => void;
}> = ({ field, handleUpdateUniformField }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [display, setDisplay] = useState(0);
  const accumulatedRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const handleRef = useRef(handleUpdateUniformField);
  handleRef.current = handleUpdateUniformField;

  useEffect(() => {
    if (!isPlaying) return;
    startRef.current = Date.now();
    const tick = () => {
      const secs =
        accumulatedRef.current + (Date.now() - startRef.current) / 1000;
      setDisplay(secs);
      handleRef.current(secs);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      accumulatedRef.current += (Date.now() - startRef.current) / 1000;
    };
  }, [isPlaying]);

  const toggle = () => setIsPlaying((p) => !p);
  const reset = () => {
    setIsPlaying(false);
    accumulatedRef.current = 0;
    setDisplay(0);
    handleRef.current(0);
  };

  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="float time" />
      <button
        onClick={toggle}
        className="text-xs font-mono text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-sm w-6 h-6 flex items-center justify-center select-none"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <span className="font-mono text-xs text-neutral-500 px-2 w-16 text-right tabular-nums">
        {display.toFixed(2)}s
      </span>
      <ResetButton onClick={reset} />
    </div>
  );
};

const MouseFieldComponent: FC<{
  field: Field & { type: "vec2"; special: "mouse" };
  handleUpdateUniformField: (value: [number, number]) => void;
}> = ({ field, handleUpdateUniformField }) => {
  const { mousePosition } = useContext(EditorContext);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const handleRef = useRef(handleUpdateUniformField);
  handleRef.current = handleUpdateUniformField;

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const p: [number, number] = [
        mousePosition.current[0],
        mousePosition.current[1],
      ];
      setPos(p);
      handleRef.current(p);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="vec2 mouse" />
      <div className="flex gap-2">
        {(["x", "y"] as const).map((axis, i) => (
          <div key={axis} className="flex items-center w-20 relative">
            <span className="absolute left-1 z-10 bg-neutral-200 h-4 w-4 grid place-items-center pointer-events-none rounded-sm">
              <p className="text-[11px] font-mono w-3 text-neutral-500 leading-0 -translate-y-0.5 translate-x-0.5">
                {axis}
              </p>
            </span>
            <span className="text-xs font-mono text-neutral-500 pl-5 pointer-events-none bg-neutral-100 rounded-sm w-full h-6 flex items-center justify-end px-1 tabular-nums">
              {pos[i].toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ImageUploadFieldComponent: FC<{
  field: Field & { type: "sampler2D" };
  handleUpdateUniformField: (value: TextureUniform | null) => void;
}> = ({ field, handleUpdateUniformField }) => {
  const [focused, setFocused] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = (file: File | null) => {
    if (file) {
      const src = URL.createObjectURL(file);
      setImageSrc(src);
      handleUpdateUniformField({ type: "texture", src });
    }
  };

  useEffect(() => {
    if (!focused) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith("image/")) {
          upload(item.getAsFile());
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [focused]);

  return (
    <div className="flex items-center py-1.5">
      <FieldLabel name={field.name} type="sampler2D texture" />
      <div className="flex flex-col items-start gap-2">
        <div
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-32 h-32 rounded overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none transition border-4 text-neutral-500 text-xs font-mono p-2 ${
            focused
              ? "bg-neutral-50 border-neutral-300"
              : "bg-neutral-100 border-neutral-50"
          }`}
        >
          {imageSrc ? (
            <img src={imageSrc} className="w-full h-full object-contain" />
          ) : focused ? (
            "cmd+V"
          ) : (
            <>
              <p>Paste</p>
              <p>Here</p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="text-xs text-neutral-500 file:button-base hover:file:bg-neutral-200 file:transition w-32"
          onChange={(e) => upload(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
};

const buildInitialUniforms = (
  fields: Field[],
  initialUniforms?: Uniforms,
): Uniforms => {
  const u: Uniforms = {};
  for (const field of fields) {
    switch (field.type) {
      case "float":
        u[field.name] = field.default ?? 0;
        break;
      case "vec2":
        u[field.name] = field.default ?? [0, 0];
        break;
      case "vec3":
        u[field.name] = field.default ?? [0, 0, 0];
        break;
      case "vec4":
        u[field.name] = field.default ?? [0, 0, 0, 0];
        break;
      // sampler2D: omitted until a file is uploaded
    }
  }
  // TODO: no type checking — blindly copy matching field names from saved uniforms
  if (initialUniforms) {
    for (const field of fields) {
      if (field.name in initialUniforms) {
        u[field.name] = initialUniforms[field.name];
      }
    }
  }
  return u;
};

const UniformForm: FC<UniformFormProps> = ({
  shader,
  initialUniforms,
  handleUpdateUniform,
}) => {
  const fields = useMemo(() => extractFields(shader), [shader]);

  const initialUniformValues = useMemo(
    () => buildInitialUniforms(fields, initialUniforms),
    [fields],
  );

  const uniformRef = useRef<Uniforms>(initialUniformValues);

  useEffect(() => {
    uniformRef.current = { ...initialUniformValues };
    handleUpdateUniform(uniformRef.current);
  }, [initialUniformValues]);

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
    <div className="rounded overflow-hidden">
      {fields.map((field) => {
        const key = `${field.name}-${field.type}`;
        const update = (newValue: any) => {
          uniformRef.current[field.name] = newValue;
          handleUpdateUniform(uniformRef.current);
        };
        const updateTexture = (newValue: TextureUniform | null) => {
          if (newValue === null) delete uniformRef.current[field.name];
          else uniformRef.current[field.name] = newValue;
          handleUpdateUniform(uniformRef.current);
        };

        switch (field.type) {
          case "float":
            return field.special === "time" ? (
              <TimeFieldComponent
                key={key}
                field={field as Field & { type: "float"; special: "time" }}
                handleUpdateUniformField={update}
              />
            ) : (
              <FloatFieldComponent
                key={key}
                field={field}
                initialValue={initialUniformValues[field.name] as number}
                handleUpdateUniformField={update}
              />
            );
          case "vec2":
            return field.special === "mouse" ? (
              <MouseFieldComponent
                key={key}
                field={field as Field & { type: "vec2"; special: "mouse" }}
                handleUpdateUniformField={update}
              />
            ) : (
              <Vec2FieldComponent
                key={key}
                field={field}
                initialValue={
                  initialUniformValues[field.name] as [number, number]
                }
                handleUpdateUniformField={update}
              />
            );
          case "vec3":
            return field.color ? (
              <Vec3ColorFieldComponent
                key={key}
                field={field}
                initialValue={
                  initialUniformValues[field.name] as [number, number, number]
                }
                handleUpdateUniformField={update}
              />
            ) : (
              <Vec3FieldComponent
                key={key}
                field={field}
                initialValue={
                  initialUniformValues[field.name] as [number, number, number]
                }
                handleUpdateUniformField={update}
              />
            );
          case "vec4":
            return field.color ? (
              <Vec4ColorFieldComponent
                key={key}
                field={field}
                initialValue={
                  initialUniformValues[field.name] as [
                    number,
                    number,
                    number,
                    number,
                  ]
                }
                handleUpdateUniformField={update}
              />
            ) : (
              <Vec4FieldComponent
                key={key}
                field={field}
                initialValue={
                  initialUniformValues[field.name] as [
                    number,
                    number,
                    number,
                    number,
                  ]
                }
                handleUpdateUniformField={update}
              />
            );
          case "sampler2D":
            if (!field.texture) return null;
            return (
              <ImageUploadFieldComponent
                key={key}
                field={field}
                handleUpdateUniformField={updateTexture}
              />
            );
        }
      })}
    </div>
  );
};

export default UniformForm;
