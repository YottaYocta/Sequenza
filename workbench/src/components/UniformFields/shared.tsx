import { useRef, useContext, useState, useEffect, type FC } from "react";
import { RotateCcw, X } from "lucide-react";
import { EditorContext } from "../EditorContext";

const toHex = (v: number) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, "0");
const fromHex = (h: string) => parseInt(h, 16) / 255;
export const vec3ToHex = ([r, g, b]: [number, number, number]) =>
  `#${toHex(r)}${toHex(g)}${toHex(b)}`;
export const hexToVec3 = (hex: string): [number, number, number] => [
  fromHex(hex.slice(1, 3)),
  fromHex(hex.slice(3, 5)),
  fromHex(hex.slice(5, 7)),
];

export const ColorPickerButton: FC<{
  color: string;
  onChange: (hex: string) => void;
}> = ({ color, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-8 h-5.5 rounded border-2 border-neutral-200 cursor-pointer"
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

export const ExpressionChip: FC<{
  label?: string;
  expr: string;
  onEdit: (newExpr: string | null) => void;
}> = ({ label, expr, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const trimmed = text.trim();
    onEdit(trimmed === "" ? null : trimmed);
    setEditing(false);
  };

  const labelSpan = label && (
    <span className="absolute left-1 z-10 bg-neutral-300 h-4 w-4 grid place-items-center pointer-events-none rounded-sm">
      <p className="text-[11px] font-mono w-3 text-neutral-500 leading-0 -translate-y-0.5 translate-x-0.5">
        {label}
      </p>
    </span>
  );

  if (editing) {
    return (
      <div className="flex items-center w-20 h-6 relative nodrag">
        {labelSpan}
        <input
          ref={inputRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setEditing(false);
            }
            if (e.key === "Backspace" && text === "") {
              e.preventDefault();
              onEdit(null);
              setEditing(false);
            }
          }}
          className={`text-xs font-mono text-neutral-500 bg-white outline outline-2 outline-neutral-400 outline-offset-1 rounded-sm w-full h-6 ${label ? "pl-6 pr-1" : "px-2"}`}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center w-20 h-6 relative select-none nodrag group/chip cursor-text"
      onClick={() => {
        setText(expr);
        setEditing(true);
      }}
    >
      {labelSpan}
      <span
        className={`text-xs font-mono text-neutral-500 bg-neutral-200 rounded-sm w-full h-6 flex items-center truncate ${label ? "pl-6 pr-5" : "px-2 pr-5"}`}
      >
        {expr}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(null);
        }}
        className="absolute right-0.75 top-0.75 h-4.5 w-4.5 flex items-center justify-center rounded-sm opacity-0 group-hover/chip:opacity-100 group-hover/chip:bg-neutral-100 text-neutral-500 text-xs leading-none"
      >
        <X size={12}></X>
      </button>
    </div>
  );
};

export const ResetButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-sm select-none shrink-0"
    title="Reset to default"
  >
    <RotateCcw size={12} />
  </button>
);

export const FieldLabel: FC<{ name: string; type: string }> = ({
  name,
  type,
}) => {
  const { showStats } = useContext(EditorContext);
  return (
    <div className=" min-w-40 flex flex-col gap-0.5 items-end">
      <span className="font-mono text-xs text-neutral-900">
        {name
          .replace("u_", "")
          .replaceAll("_", " ")
          .replace(/\b\w/g, (s) => s.toUpperCase())}
      </span>
      {showStats && (
        <span className="font-mono text-[10px] text-neutral-500">{type}</span>
      )}
    </div>
  );
};
