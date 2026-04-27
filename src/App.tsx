import { useRef, useState } from "react";
import logo from "./assets/AE-LOGO.svg";
import { cn } from "./lib/utils/utils";
import {
  freqToNormalized,
  getBandVisuals,
  getMarkerPositions,
  getSelectedBandValues,
  normalizedToFreq,
  xToNormalized,
} from "./lib/utils/eqMath";
import Controls from "./components/Controls";
import type { freqBand, Knob } from "./types/Types";
import {
  baselineY,
  minQ,
  maxQ,
  minGain,
  maxGain,
  minAngle,
  maxAngle,
  maxBellHeight,
  graphMinX,
  graphMaxX,
  freqMarkers,
  majorIndexes,
  bands,
} from "./constants";
import { CurveLine } from "./components/CurveLine";
import { BandHandles } from "./components/BandHandles";
import { getFreqLabelValues, getGainLabelValues } from "./lib/utils/uiMath";
import { AudioPlayer } from "./components/AudioPlayer";

function App() {
  // ============================================================
  //                          State
  // ============================================================

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

  // Which band should display labels
  const labelBandIndex =
    hoveredBandIndex !== null ? hoveredBandIndex : selectedBandIndex;

  // Grid marker positions
  const markerPositions = getMarkerPositions(freqMarkers, graphMinX, graphMaxX);

  // Selected band visual values
  const {
    handleX,
    handleYFromGain,
    freqKnobRotation,
    qRotation,
    gainRotation,
  } = getSelectedBandValues({
    band: bandsArr[selectedBandIndex],
    graphMinX,
    graphMaxX,
    maxGain,
    maxBellHeight,
    baselineY,
    minAngle,
    maxAngle,
  });

  // Gain label values
  const { gainLabel, gainLabelWidth, gainLabelX, gainLabelY } =
    getGainLabelValues({
      gainValue: bandsArr[labelBandIndex].gainValue,
      handleX,
      handleYFromGain,
    });

  // Gain label visibility
  const showGainLabel =
    isHandleDragging ||
    isGainKnobHovered ||
    (isKnobDragging && activeKnob === "GAIN");

  // Frequency label values
  const { freqLabel, freqLabelWidth, freqLabelX, freqLabelY } =
    getFreqLabelValues({
      freqValue: bandsArr[labelBandIndex].freqValue,
      handleX,
      handleYFromGain,
    });

  // Frequency label visibility
  const showFreqLabel =
    isHandleDragging ||
    isFreqKnobHovered ||
    (isKnobDragging && activeKnob === "FREQ");

  // ==========================================================
  //                       Handlers
  // ==========================================================

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
      className="relative min-h-screen w-full flex items-center justify-center bg-[#111113] select-none"
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
          "relative",
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
        <div className="absolute top-0 left-0 flex justify-between items-center w-full h-10 p-2 bg-[#141417] border-b-2 border-[#19191c] ring-1 ring-inset ring-white/5 overflow-hidden z-10">
          <div className="flex">
          <img src={logo} alt="logo" className="invert-25 w-8" />
          <h1 className="ml-2 text-[21px] font-semibold italic tracking-wide text-white/25">
            EQ-6
          </h1>
          </div>
          <AudioPlayer />
        </div>
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
              const { bandPath } = getBandVisuals({
                freqValue: band.freqValue,
                gainValue: band.gainValue,
                qValue: band.qValue,
                bandType: band.type,
                graphMinX,
                graphMaxX,
                maxGain,
                maxBellHeight,
                baselineY,
              });

              const fillId = `bandFill-${index}`;

              return (
                <CurveLine
                  key={index}
                  band={band}
                  fillId={fillId}
                  index={index}
                  bandPath={bandPath}
                  baselineY={baselineY}
                  selectedBandIndex={selectedBandIndex}
                  showFreqLabel={showFreqLabel}
                  freqLabelX={freqLabelX}
                  freqLabelY={freqLabelY}
                  freqLabelWidth={freqLabelWidth}
                  freqLabel={freqLabel}
                  showGainLabel={showGainLabel}
                  gainLabelX={gainLabelX}
                  gainLabelY={gainLabelY}
                  gainLabelWidth={gainLabelWidth}
                  gainLabel={gainLabel}
                />
                // <svg
                //   className="absolute inset-0 w-full h-full"
                //   style={{ pointerEvents: "none" }}
                //   preserveAspectRatio="none"
                //   viewBox="0 0 800 480"
                //   key={index}
                // >
                //   <defs>
                //     {/* Bell fill */}
                //     <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                //       <stop
                //         offset="100%"
                //         stopColor={band.color}
                //         stopOpacity="0.34"
                //       />
                //     </linearGradient>
                //     {/* Glow filter for the handle */}
                //     <filter
                //       id="handleGlow"
                //       x="-80%"
                //       y="-80%"
                //       width="260%"
                //       height="260%"
                //     >
                //       <feGaussianBlur stdDeviation="4" result="blur" />
                //       <feMerge>
                //         <feMergeNode in="blur" />
                //         <feMergeNode in="SourceGraphic" />
                //       </feMerge>
                //     </filter>
                //   </defs>

                //   {/* Bell curve — fill + stroke wrapped in fade mask */}
                //   <path
                //     d={`${bandPath} L 800 ${baselineY} L 0 ${baselineY} Z`}
                //     fill={`url(#${fillId})`}
                //     className={
                //       selectedBandIndex === index ? "opacity-100" : "opacity-40"
                //     }
                //   />
                //   <path
                //     d={bandPath}
                //     fill="none"
                //     stroke={band.color}
                //     strokeWidth="1.5"
                //     strokeOpacity="0.85"
                //   />
                //   <ValueLabel
                //     show={showFreqLabel}
                //     x={freqLabelX}
                //     y={freqLabelY}
                //     width={freqLabelWidth}
                //     text={freqLabel}
                //   />
                //   <ValueLabel
                //     show={showGainLabel}
                //     x={gainLabelX}
                //     y={gainLabelY}
                //     width={gainLabelWidth}
                //     text={gainLabel}
                //   />
                // </svg>
              );
            })}
            {bandsArr.map((band, index) => {
              const { bandHandleX, bandGainHeight } = getBandVisuals({
                freqValue: band.freqValue,
                gainValue: band.gainValue,
                qValue: band.qValue,
                bandType: band.type,
                graphMinX,
                graphMaxX,
                maxGain,
                maxBellHeight,
                baselineY,
              });

              const bandHandleY =
                band.type === "bell"
                  ? baselineY - bandGainHeight
                  : baselineY - bandGainHeight * 0.5;

              return (
                <BandHandles
                  key={index}
                  band={band}
                  index={index}
                  bandHandleX={bandHandleX}
                  bandHandleY={bandHandleY}
                  setHoveredBandIndex={setHoveredBandIndex}
                  setSelectedBandIndex={(index) => {
                    if (index !== null) setSelectedBandIndex(index);
                  }}
                  setIsHandleDragging={setIsHandleDragging}
                />
                //
                // <svg
                //   className="absolute inset-0 w-full h-full"
                //   style={{ pointerEvents: "none" }}
                //   preserveAspectRatio="none"
                //   viewBox="0 0 800 480"
                //   key={index}
                // >
                //   <g
                //     style={{
                //       transformOrigin: `${bandHandleX}px ${bandHandleY}px`,
                //       transition: "transform 0.15s ease",
                //       cursor: "pointer",
                //     }}
                //     className="group hover:scale-120"
                //     pointerEvents="all"
                //     onMouseEnter={() => setHoveredBandIndex(index)}
                //     onMouseLeave={() => setHoveredBandIndex(null)}
                //     onMouseDown={(e) => {
                //       e.stopPropagation();
                //       setSelectedBandIndex(index);
                //       setIsHandleDragging(true);
                //     }}
                //     onMouseUp={(e) => {
                //       e.stopPropagation();
                //       setIsHandleDragging(false);
                //     }}
                //   >
                //     <circle
                //       cx={bandHandleX}
                //       cy={bandHandleY}
                //       r="6"
                //       fill={band.color}
                //       filter="url(#handleGlow)"
                //     />
                //     {/* Inner bright dot */}
                //     <circle
                //       cx={bandHandleX}
                //       cy={bandHandleY}
                //       r="3"
                //       fill={band.color}
                //     />
                //   </g>
                // </svg>
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
            bandsArr={bandsArr}
            selectedBandIndex={selectedBandIndex}
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
