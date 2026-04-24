import { useRef, useState } from "react";
import {
  cn,
  freqToNormalized,
  normalizedToFreq,
  normalizedToX,
  xToNormalized,
} from "./lib/utils";
import Controls from "./components/Controls";
import type { freqBand, Knob } from "./types/Types";
import {
  baselineY,
  minQ,
  maxQ,
  minGain,
  maxGain,
  minWidth,
  maxWidth,
  minAngle,
  maxAngle,
  maxBellHeight,
  graphMinX,
  graphMaxX,
  freqMarkers,
  majorIndexes,
  bands,
} from "./constants";
import { ValueLabel } from "./components/ValueLabel";

function App() {
  // ====================
  // State
  // ====================

  const graphPanelRef = useRef<HTMLDivElement | null>(null);
  const [bandsArr, setBandsArr] = useState<freqBand[]>(bands);
  const [selectedBandIndex, setSelectedBandIndex] = useState<number>(0);
  const [isHandleDragging, setIsHandleDragging] = useState<boolean>(false);
  const [isKnobDragging, setIsKnobDragging] = useState<boolean>(false);
  const [lastMouseY, setLastMouseY] = useState<number>(0);
  const [activeKnob, setActiveKnob] = useState<Knob>(null);
  const [isFreqKnobHovered, setIsFreqKnobHovered] = useState<boolean>(false);
  const [isGainKnobHovered, setIsGainKnobHovered] = useState<boolean>(false);
  const [hoveredBandIndex, setHoveredBandIndex] = useState<number | null>(null);
  const [knobDblClicked, setKnobDblClicked] = useState<"FREQ" | "GAIN" | null>(
    null,
  );

  const labelBandIndex =
    hoveredBandIndex !== null ? hoveredBandIndex : selectedBandIndex;

  const markerPositions = freqMarkers.map((freq) =>
    normalizedToX(freqToNormalized(freq), graphMinX, graphMaxX),
  );

  // ====================
  // Derived from state (rotation → Q / Gain / Freq)
  // ====================

  const normalizedFreq = freqToNormalized(
    bandsArr[selectedBandIndex].freqValue,
  );
  const handleX = normalizedToX(normalizedFreq, graphMinX, graphMaxX);
  const freqKnobRotation = minAngle + normalizedFreq * (maxAngle - minAngle);

  // ====================
  // Derived from Q (Q → width)
  // ====================
  const selectedNormalizedQ =
    (bandsArr[selectedBandIndex].qValue - minQ) / (maxQ - minQ);

  const qRotation = minAngle + selectedNormalizedQ * (maxAngle - minAngle);

  // ====================
  // Derived from G (Gain → height)
  // ====================
  const signedGain = bandsArr[selectedBandIndex].gainValue / maxGain;
  const gainHeightFromKnob = signedGain * maxBellHeight;
  const handleYFromGain = baselineY - gainHeightFromKnob;
  const gainRotation = bandsArr[selectedBandIndex].gainValue * 4.5;

  const gainLabel = `${Math.round(bandsArr[labelBandIndex].gainValue)} db`;

  const gainLabelWidth = Math.max(52, gainLabel.length * 6.8 + 12);
  const gainLabelX = Math.max(
    4,
    Math.min(800 - gainLabelWidth - 4, handleX - gainLabelWidth - 14),
  );
  const gainLabelY = handleYFromGain - 8;
  const showGainLabel =
    isHandleDragging ||
    isGainKnobHovered ||
    (isKnobDragging && activeKnob === "GAIN");

  // ====================
  // Derived from FREQ
  // ====================

  const freqLabel = `${Math.round(bandsArr[labelBandIndex].freqValue)} Hz`;

  const freqLabelWidth = Math.max(52, freqLabel.length * 6.8 + 12);
  const freqLabelX = Math.max(
    4,
    Math.min(800 - freqLabelWidth - 4, handleX - freqLabelWidth / 2),
  );
  const freqLabelY = handleYFromGain - 28;
  const showFreqLabel =
    isHandleDragging ||
    isFreqKnobHovered ||
    (isKnobDragging && activeKnob === "FREQ");


  // ====================
  // Handlers
  // ====================

  function updateBands(key: string, value: number) {
    setBandsArr((prev) => {
      return prev.map((band, index) =>
        index === selectedBandIndex ? { ...band, [key]: value } : band,
      );
    });
  }

  function handleKnobMouseDown(e: React.MouseEvent<HTMLElement>): void {
    setIsKnobDragging(true);
    setLastMouseY(e.clientY);
  }

  function handleKnobDrag(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
    if (!isKnobDragging) return;

    const currY = e.clientY;
    const deltaY = currY - lastMouseY;

    if (activeKnob === "Q") {
      const sensitivity = 0.1;
      const currentQ = bandsArr[selectedBandIndex].qValue;
      const nextQ = currentQ - deltaY * sensitivity;
      const clampedNextQ = Math.max(minQ, Math.min(maxQ, nextQ));
      updateBands("qValue", clampedNextQ);

      setLastMouseY(currY);
    }

    if (activeKnob === "GAIN") {
      const sensitivity = 0.25;
      const next =
        bandsArr[selectedBandIndex].gainValue - deltaY * sensitivity || 0;
      const clampedNext = Math.max(minGain, Math.min(maxGain, next));
      updateBands("gainValue", clampedNext);
      setLastMouseY(currY);
    }

    if (activeKnob === "FREQ") {
      const sensitivity = 0.005;
      const currentFreq = bandsArr[selectedBandIndex].freqValue;
      // 1. convert to normalized (0–1)
      const normalized = freqToNormalized(currentFreq);
      // 2. apply mouse delta in normalized space
      const nextNormalized = normalized - deltaY * sensitivity;
      // 3. clamp 0–1
      const clampedNormalized = Math.max(0, Math.min(1, nextNormalized));
      // 4. convert back to Hz
      const newFreq = normalizedToFreq(clampedNormalized);
      // 5. update band
      updateBands("freqValue", newFreq);
      setLastMouseY(currY);
    }
  }


  function handleHandleDrag(
    e: React.MouseEvent<HTMLElement, MouseEvent>,
  ): void {
    if (!isHandleDragging) return;
    if (!graphPanelRef.current) return;

    const rect = graphPanelRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // Map panel-local mouse coords to SVG graph space (800 x 480)
    const graphX = (localX / rect.width) * 800;
    const graphY = (localY / rect.height) * 480;

    // Keep handle within graph bounds
    const clampedY = Math.max(0, Math.min(480, graphY));
    const clampedX = Math.max(0, Math.min(800, graphX));
    const normalized = xToNormalized(clampedX, graphMinX, graphMaxX);
    const newFreqValue = normalizedToFreq(normalized);
    updateBands("freqValue", newFreqValue);
    // setFreqValue(newFreqValue);

    const distance = baselineY - clampedY;
    const newGainValue = distance * (1 / 6);
    const clampedGainValue = Math.max(minGain, Math.min(maxGain, newGainValue));
    updateBands("gainValue", clampedGainValue);

  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#111113] select-none"
      onMouseMove={(e) => {
        if (isKnobDragging) handleKnobDrag(e);
        if (isHandleDragging) handleHandleDrag(e);
      }}
      onMouseUp={() => {
        setIsKnobDragging(false);
        setIsHandleDragging(false);
      }}
    >
      <div
        className={cn(
          "w-[70%] max-w-200 h-150",
          "flex flex-col",
          "rounded-xl",
          // Outer border + inset highlight ring for a layered surface feel
          "border border-[#0c0c0e]",
          "ring-1 ring-inset ring-white/5",
          "overflow-hidden",
          // Multi-layer shadow: tight contact shadow + mid diffuse + wide ambient
          "shadow-[0_2px_4px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.45),0_32px_72px_rgba(0,0,0,0.3)]",
        )}
      >
        {/* Top row — EQ display area */}
        <div
          ref={graphPanelRef}
          className="flex-3 relative overflow-hidden"
          style={{
            // Top-to-bottom gradient: slightly lifted top, darker toward the divider
            background: "linear-gradient(to bottom, #1f1f24 0%, #18181c 100%)",
          }}
        >
          {/* Horizontal dB lines — sparse, faint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
              backgroundSize: "100% 80px",
            }}
          />
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "none" }}
            preserveAspectRatio="none"
            viewBox="0 0 800 480"
          >
            {markerPositions.map((x, i) => {
              const isMajor = majorIndexes.includes(i);
              return (
                <line
                  key={i}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={480}
                  stroke="white"
                  strokeOpacity={isMajor ? 0.25 : 0.08}
                  strokeWidth={1}
                />
              );
            })}

            {/* EQ band — visual only */}
            {bandsArr.map((band, index) => {
              const bandNormalizedFreq = freqToNormalized(band.freqValue);
              const bandHandleX = normalizedToX(
                bandNormalizedFreq,
                graphMinX,
                graphMaxX,
              );
              const bandSignedGain = band.gainValue / maxGain;
              const bandGainHeight = bandSignedGain * maxBellHeight;

              const bandNormalizedQ = (band.qValue - minQ) / (maxQ - minQ);
              const bandInvertedQ = 1 - bandNormalizedQ;
              const bandWidth =
                minWidth + bandInvertedQ * (maxWidth - minWidth);

              let bandPath = `M 0 ${baselineY}`;
              const fillId = `bandFill-${index}`;

              for (let x = 0; x <= 800; x += 4) {
                const dx = x - bandHandleX;
                const slope = bandWidth / 2;

                const bell = Math.exp(-(dx * dx) / (2 * bandWidth * bandWidth));

                const lowShelf = 1 / (1 + Math.exp((x - bandHandleX) / slope));

                const highShelf = 1 / (1 + Math.exp((bandHandleX - x) / slope));

                const shape =
                  band.type === "low-shelf"
                    ? lowShelf
                    : band.type === "high-shelf"
                      ? highShelf
                      : bell;

                const y = baselineY - bandGainHeight * shape;

                bandPath += ` L ${x} ${y}`;
              }
              return (
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ pointerEvents: "none" }}
                  preserveAspectRatio="none"
                  viewBox="0 0 800 480"
                  key={index}
                >
                  <defs>
                    {/* Bell fill */}
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="100%"
                        stopColor={band.color}
                        stopOpacity="0.34"
                      />
                    </linearGradient>
                    {/* Glow filter for the handle */}
                    <filter
                      id="handleGlow"
                      x="-80%"
                      y="-80%"
                      width="260%"
                      height="260%"
                    >
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
                    className={
                      selectedBandIndex === index ? "opacity-100" : "opacity-40"
                    }
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
            })}
            {bandsArr.map((band, index) => {
              const bandNormalizedFreq = freqToNormalized(band.freqValue);
              const bandHandleX = normalizedToX(
                bandNormalizedFreq,
                graphMinX,
                graphMaxX,
              );
              const bandSignedGain = band.gainValue / maxGain;
              const bandGainHeight = bandSignedGain * maxBellHeight;
              const bandHandleY =
                band.type === "bell"
                  ? baselineY - bandGainHeight
                  : baselineY - bandGainHeight * 0.5;

              return (
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ pointerEvents: "none" }}
                  preserveAspectRatio="none"
                  viewBox="0 0 800 480"
                  key={index}
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
                    <circle
                      cx={bandHandleX}
                      cy={bandHandleY}
                      r="3"
                      fill={band.color}
                    />
                  </g>
                </svg>
              );
            })}
          </svg>
        </div>

        {/* Divider — stronger than the grid lines, 2px compound treatment */}
        <div className="shrink-0">
          <div className="h-px bg-[#0a0a0c]" />
          <div className="h-px bg-[#2a2a2f]" />
        </div>

        {/* Bottom control strip — 20% height, slightly darker/sunken */}
        <div
          className="flex-1 bg-[#141417] flex items-center justify-center gap-20"
          onMouseDownCapture={() => {
            setKnobDblClicked(null);
          }}
        >
          <Controls
            qRotation={qRotation}
            gainRotation={gainRotation}
            freqKnobRotation={freqKnobRotation}
            knobDblClicked={knobDblClicked}
            setKnobDblClicked={setKnobDblClicked}
            updateBands={updateBands}
            setActiveKnob={setActiveKnob}
            setIsFreqKnobHovered={setIsFreqKnobHovered}
            setIsGainKnobHovered={setIsGainKnobHovered}
            handleKnobMouseDown={handleKnobMouseDown}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
