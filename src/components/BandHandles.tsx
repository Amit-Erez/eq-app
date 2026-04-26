import type { handleProps } from "../types/Types";


export function BandHandles({
  band,
  index,
  bandHandleX,
  bandHandleY,
  setHoveredBandIndex,
  setSelectedBandIndex,
  setIsHandleDragging,
}: handleProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
      preserveAspectRatio="none"
      viewBox="0 0 800 480"
    >
      <g
        style={{
          transformOrigin: `${bandHandleX}px ${bandHandleY}px`,
          transition: "transform 0.15s ease",
          cursor: "pointer",
        }}
        className="group hover:scale-120"
        pointerEvents="all"
        onMouseEnter={() => setHoveredBandIndex(index)}
        onMouseLeave={() => setHoveredBandIndex(null)}
        onMouseDown={(e) => {
          e.stopPropagation();
          setSelectedBandIndex(index);
          setIsHandleDragging(true);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          setIsHandleDragging(false);
        }}
      >
        <circle
          cx={bandHandleX}
          cy={bandHandleY}
          r="6"
          fill={band.color}
          filter="url(#handleGlow)"
        />
        {/* Inner bright dot */}
        <circle cx={bandHandleX} cy={bandHandleY} r="3" fill={band.color} />
      </g>
    </svg>
  );
}
