import { useState, useRef, useEffect, type FC } from "react";
import type { Field, GradientUniform, GradientStop } from "@sequenza/lib";
import { evalGradientAt } from "@sequenza/lib";
import { Scrubber } from "../Scrubber";
import { ColorPickerButton } from "./shared";

const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
  { position: 0, color: "#000000" },
  { position: 1, color: "#ffffff" },
];

export const GradientField: FC<{
  field: Field & { type: "sampler2D"; source: "gradient" };
  value?: GradientUniform;
  handleUpdateUniformField: (value: GradientUniform) => void;
}> = ({ value: initialValue, handleUpdateUniformField }) => {
  const [stops, setStops] = useState<GradientStop[]>(
    initialValue?.stops ?? DEFAULT_GRADIENT_STOPS,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    for (let i = 0; i < canvas.width; i++) {
      ctx.fillStyle = evalGradientAt(stops, i / (canvas.width - 1));
      ctx.fillRect(i, 0, 1, canvas.height);
    }
    handleUpdateUniformField({ type: "gradient", stops });
  }, [stops]);

  const startDrag = (stopIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const ramp = rampRef.current;
    if (!ramp) return;
    const onMove = (e: MouseEvent) => {
      const rect = ramp.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const position = x / rect.width;
      setStops((prev) =>
        prev.map((s, i) => (i === stopIndex ? { ...s, position } : s)),
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const addStop = () =>
    setStops((prev) => [...prev, { position: 1, color: "#ffffff" }]);

  const removeStop = (idx: number) => {
    if (stops.length <= 1) return;
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStopPosition = (idx: number, position: number) =>
    setStops((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, position } : s)),
    );

  const updateStopColor = (idx: number, color: string) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, color } : s)));

  return (
    <div className="flex flex-col  gap-3 p-2">
      <div ref={rampRef} className="relative w-32 h-4 nodrag nopan">
        <canvas
          ref={canvasRef}
          width={128}
          height={16}
          className="w-32 h-4 rounded-sm border-2 border-neutral-200"
        />
        {stops.map((stop, idx) => (
          <button
            key={idx}
            aria-label={`gradient stop ${idx}`}
            className="absolute w-4 h-4 -translate-x-1/2 -bottom-2 rounded-sm border-2 border-neutral-200 cursor-ew-resize"
            style={{
              left: `${stop.position * 100}%`,
              backgroundColor: stop.color,
            }}
            onMouseDown={startDrag(idx)}
          />
        ))}
      </div>
      <div className="flex items-center justify-between w-32">
        <span className="font-mono text-[10px] text-neutral-500">STOPS</span>
        <button
          onClick={addStop}
          className="font-mono text-[10px] text-neutral-500 hover:text-neutral-800 leading-none"
        >
          ADD +
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {stops.map((stop, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Scrubber
              value={stop.position}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateStopPosition(idx, v)}
            />
            <ColorPickerButton
              color={stop.color}
              onChange={(hex) => updateStopColor(idx, hex)}
            />
            {stops.length > 1 && (
              <button
                onClick={() => removeStop(idx)}
                className="text-xs text-neutral-400 hover:text-neutral-700 leading-none px-1"
                aria-label={`remove stop ${idx}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
