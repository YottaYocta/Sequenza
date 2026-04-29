import { useContext, useEffect, useState, type FC } from "react";
import { Panel } from "@xyflow/react";
import { EditorContext } from "./EditorContext";
import { Pause, Play, RotateCcw } from "lucide-react";

export const GlobalTimeline: FC = () => {
  const { elapsedRef, playing, setPlaying, resetTime } =
    useContext(EditorContext);
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      setDisplayTime(elapsedRef.current);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <Panel position="bottom-center">
      <div className="flex items-center gap-1 bg-white rounded-md p-1 mb-2">
        <button
          className="button-base w-7 h-7 flex items-center justify-center"
          onClick={() => setPlaying(!playing)}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          className="button-base w-7 h-7 flex items-center justify-center"
          onClick={resetTime}
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
        <span className="font-mono text-xs text-neutral-500 tabular-nums w-14 text-right pr-1">
          {displayTime.toFixed(2)}s
        </span>
      </div>
    </Panel>
  );
};
