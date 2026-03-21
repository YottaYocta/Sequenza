import { useRef, useContext, type FC } from "react";
import { EditorContext } from "../EditorContext";

export const toHex = (v: number) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, "0");
export const fromHex = (h: string) => parseInt(h, 16) / 255;
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

export const ResetButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-sm select-none shrink-0"
    title="Reset to default"
  >
    ↺
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
