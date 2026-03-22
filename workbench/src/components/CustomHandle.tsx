import { Handle, Position, type HandleProps } from "@xyflow/react";
import { type FC } from "react";

const HANDLE_SIZE = 14;
const MAX_HANDLE_SPREAD = 50;

interface CustomHandleProps extends HandleProps {
  count?: {
    total: number;
    index: number;
  };
}

const CustomHandle: FC<CustomHandleProps> = ({ id, type, position, count }) => {
  const isSource = type === "source";

  let classes: string;

  if (isSource) {
    classes =
      "bg-neutral-300 text-neutral-500 hover:border-neutral-500 hover:text-neutral-800 bg-[#78A3C4]";
  } else {
    classes = "bg-neutral-300";
  }

  return (
    <Handle
      id={id}
      type={type}
      position={position}
      className={`${position === Position.Top ? "top-0 " : position === Position.Bottom ? "bottom-0" : ""}`}
      style={{
        background: "none",
        border: "none",
        width: HANDLE_SIZE * 2,
        height: HANDLE_SIZE,
        ...(count
          ? {
              transform: `translateX(${(count.index / (count.total - 1)) * MAX_HANDLE_SPREAD - MAX_HANDLE_SPREAD / 2 - HANDLE_SIZE}px)`,
            }
          : {}),
      }}
    >
      <div
        className={`absolute inset-0 rounded-full flex items-center justify-center text-xs font-mono leading-none pointer-events-none transition-colors ${classes}`}
      />
    </Handle>
  );
};

export default CustomHandle;
