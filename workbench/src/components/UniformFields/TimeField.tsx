import { useState, useEffect, type FC } from "react";
import type { Field } from "@sequenza/lib";
import { ResetButton } from "./shared";

export const TimeField: FC<{
  field: Field & { type: "float"; special: "time" };
  handleUpdateUniformField: (value: number) => void;
}> = ({ handleUpdateUniformField }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const start = Date.now() - currentTime * 1000;
    let rafId: number;
    const tick = () => {
      const t = (Date.now() - start) / 1000;
      setCurrentTime(t);
      handleUpdateUniformField(t);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const reset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    handleUpdateUniformField(0);
  };

  return (
    <div className="flex items-center ">
      <button
        onClick={() => setIsPlaying((p) => !p)}
        className="text-xs font-mono text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-sm w-6 h-6 flex items-center justify-center select-none"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <span className="font-mono text-xs text-neutral-500 px-2 w-16 text-right tabular-nums">
        {currentTime.toFixed(2)}s
      </span>
      <ResetButton onClick={reset} />
    </div>
  );
};
