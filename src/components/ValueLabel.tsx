import { cn } from "../lib/utils/utils";

export function ValueLabel({
  show,
  x,
  y,
  width,
  text,
}: {
  show: boolean;
  x: number;
  y: number;
  width: number;
  text: string;
}) {
  return (
    <g
      pointerEvents="none"
      className={cn(
        "transition-opacity duration-150",
        show ? "opacity-100" : "opacity-0",
      )}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={16}
        rx={3}
        fill="rgba(18,18,22,0.78)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.7}
      />
      <text
        x={x + width / 2}
        y={y + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="rgba(255,255,255,0.50)"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.02em"
      >
        {text}
      </text>
    </g>
  );
}
