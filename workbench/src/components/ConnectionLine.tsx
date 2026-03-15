import {
  getBezierPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";

export default function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  toHandle,
}: ConnectionLineComponentProps) {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });
  const label = toHandle ? "connect" : "new";
  const chipY = toY - 26;
  const chipPadX = 6;
  const chipH = 16;
  // approximate text width: ~6px per char at font-size 10
  const chipW = label.length * 6 + chipPadX * 2;

  return (
    <g>
      <path fill="none" stroke="#b1b1b7" strokeWidth={1.5} d={edgePath} />
      {/* label chip */}
      <rect
        x={toX - chipW / 2}
        y={chipY - chipH / 2}
        width={chipW}
        height={chipH}
        rx={4}
        fill={toHandle ? "#404040" : "#e5e5e5"}
        style={{ pointerEvents: "none" }}
      />
      <text
        x={toX}
        y={chipY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontFamily="monospace"
        fill={toHandle ? "#ffffff" : "#525252"}
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {label}
      </text>
      {/* endpoint circle — html via foreignObject to match CustomHandle */}
      <foreignObject x={toX - 8} y={toY - 8} width={16} height={16} style={{ overflow: "visible" }}>
        <div className="w-4 h-4 rounded-full bg-neutral-400" />
      </foreignObject>
    </g>
  );
}
