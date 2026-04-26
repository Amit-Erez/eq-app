import type { CurveLineProps } from "../types/Types";
import { ValueLabel } from "./ValueLabel";


export function CurveLine({
  band,
  fillId,
  index,
  bandPath,
  baselineY,
  selectedBandIndex,
  showFreqLabel,
  freqLabelX,
  freqLabelY,
  freqLabelWidth,
  freqLabel,
  showGainLabel,
  gainLabelX,
  gainLabelY,
  gainLabelWidth,
  gainLabel,
}: CurveLineProps) {

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
      preserveAspectRatio="none"
      viewBox="0 0 800 480"
    >
      <defs>
        {/* Bell fill */}
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="100%" stopColor={band.color} stopOpacity="0.34" />
        </linearGradient>
        {/* Glow filter for the handle */}
        <filter id="handleGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Bell curve — fill + stroke wrapped in fade mask */}
      <path
        d={`${bandPath} L 800 ${baselineY} L 0 ${baselineY} Z`}
        fill={`url(#${fillId})`}
        className={selectedBandIndex === index ? "opacity-100" : "opacity-40"}
      />
      <path
        d={bandPath}
        fill="none"
        stroke={band.color}
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />
      <ValueLabel
        show={showFreqLabel}
        x={freqLabelX}
        y={freqLabelY}
        width={freqLabelWidth}
        text={freqLabel}
      />
      <ValueLabel
        show={showGainLabel}
        x={gainLabelX}
        y={gainLabelY}
        width={gainLabelWidth}
        text={gainLabel}
      />
    </svg>
  );
}
