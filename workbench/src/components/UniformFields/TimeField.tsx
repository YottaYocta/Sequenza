import { useContext, useEffect, useState, type FC } from "react";
import { EditorContext } from "../EditorContext";

export const TimeField: FC = () => {
  const { elapsedRef } = useContext(EditorContext);
  const [displayTime, setDisplayTime] = useState(elapsedRef.current);

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
    <span className="font-mono text-xs text-neutral-500 tabular-nums">
      {displayTime.toFixed(2)}s
    </span>
  );
};
