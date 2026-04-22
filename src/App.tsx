import { useRef, useState } from "react";
import { cn } from "./lib/utils";
import Controls from "./components/Controls";
import type { BandNumber, Knob, Location } from "./types/Types";
import { baselineY, minQ, maxQ, minGain, maxGain, minWidth, maxWidth, minAngle, maxAngle, maxBellHeight } from "./constants";


function App() {
  // ====================
  // State
  // ====================
  const [handleLoc, setHandleLoc] = useState<Location>({ x: 500, y: 155 });
  const [isHandleDragging, setIsHandleDragging] = useState<boolean>(false);
  const [isKnobDragging, setIsKnobDragging] = useState<boolean>(false);
  const [qRotation, setQRotation] = useState<number>(60);
  const [gainValue, setGainValue] = useState<number>(0);
  const [freqRotation, setFreqRotation] = useState<number>(40);
  const [lastMouseY, setLastMouseY] = useState<number>(0);
  const [activeKnob, setActiveKnob] = useState<Knob>(null);
  const [bandSelected, setBandSelected] = useState<BandNumber>(null);
  const graphPanelRef = useRef<HTMLDivElement | null>(null);


  // ====================
  // Derived from state (rotation → Q / Gain / Freq)
  // ====================
  const normalizedRotation: number =
    (qRotation - minAngle) / (maxAngle - minAngle);
  const mappedQ: number = minQ + normalizedRotation * (maxQ - minQ);

  // ====================
  // Derived from Q (Q → width)
  // ====================
  const normalizedQ: number = (mappedQ - minQ) / (maxQ - minQ);
  const inverted: number = 1 - normalizedQ;
  const qRange: number = maxWidth - minWidth;
  const width: number = minWidth + inverted * qRange;

  // ====================
  // Derived from G (Gain → height)
  // ====================
  const signedGain = gainValue / maxGain
const gainHeightFromKnob = signedGain * maxBellHeight
const handleYFromGain = baselineY - gainHeightFromKnob
const gainRotation = gainValue * 4.5

  // ====================
  // Curve inputs
  // ====================
  const centerX: number = handleLoc.x;
  const gainHeight: number = gainHeightFromKnob;

  // ====================
  // Path generation
  // ====================
  let path: string = `M 0 ${baselineY}`;

  for (let x = 0; x <= 800; x += 4) {
    const dx: number = x - centerX;
    const bell: number = Math.exp(-(dx * dx) / (2 * width * width));
    const y: number = baselineY - gainHeight * bell;
    path += ` L ${x} ${y}`;
  }

  // ====================
  // Handlers
  // ====================

  function handleKnobMouseDown(e: React.MouseEvent<HTMLElement>): void {
    setIsKnobDragging(true);
    setLastMouseY(e.clientY);
  }

  function handleKnobDrag(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
    if (!isKnobDragging) return;
    if (bandSelected === null) return;
    
    const currY = e.clientY;
    const deltaY = currY - lastMouseY;

    if (activeKnob === "Q") {
      const sensitivity = 1.5;
      setQRotation((prev) => {
        const next = prev - deltaY * sensitivity;
        if (next > maxAngle) return maxAngle;
        if (next < minAngle) return minAngle;

        return next;
      });
      setLastMouseY(currY);
    }

    if (activeKnob === "GAIN") {
      const sensitivity = 0.25;
      setGainValue((prev) => {
        const next = prev - deltaY * sensitivity;
        if (next > maxGain) return maxGain;
        if (next < minGain) return minGain;

        return next;
      });
      setLastMouseY(currY);
    }

    // if (activeKnob === "FREQ") {
    //   setFreqRotation((prev) => {
    //     const next = prev - deltaY * sensitivity;
    //     if (next > 135) return 135;
    //     if (next < -135) return -135;

    //     return next;
    //   });
    //   setLastMouseY(currY);
    // }
  }


  function handleBandSelect(band: BandNumber): void {
    if (band === bandSelected) return;
    setBandSelected((prev) => (prev === band ? null : band));
    console.log("Selected band:", band);
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
    const clampedX = Math.max(0, Math.min(800, graphX));
    const clampedY = Math.max(0, Math.min(480, graphY));

    const distance = baselineY - clampedY
    const newGainValue = distance * (1/6)
    setGainValue(() => {
      if (newGainValue > maxGain) return maxGain;
      if (newGainValue < minGain) return minGain; 
      return newGainValue;
    })
  
    setHandleLoc((prev) => ({ x: clampedX, y: prev.y }));
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
          onMouseDown={() => handleBandSelect(null)}
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
          {/* Vertical frequency lines — denser, slightly more prominent */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.052) 1px, transparent 1px)",
              backgroundSize: "40px 100%",
            }}
          />

          {/* EQ band — visual only */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "none" }}
            preserveAspectRatio="none"
            viewBox="0 0 800 480"
          >
            <defs>
              {/* Bell fill */}
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="100%" stopColor="#5b8cff" stopOpacity="0.34" />
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
              d={`${path} L 800 ${baselineY} L 0 ${baselineY} Z`}
              fill="url(#bandFill)"
              className={bandSelected === 1 ? "opacity-100" : "opacity-60"}
            />
            <path
              d={path}
              fill="none"
              stroke="#5b8cff"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* Handle — the draggable-looking control point */}
            <g
              style={{
                transformOrigin: `${handleLoc.x}px ${handleYFromGain}px`,
                transition: "transform 0.15s ease",
                cursor: "pointer",
              }}
              className="hover:scale-120"
              pointerEvents="all"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleBandSelect(1);
                setIsHandleDragging(true);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setIsHandleDragging(false);
              }}
            >
              <circle
                cx={handleLoc.x}
                cy={handleYFromGain}
                r="6"
                fill="#7aa8ff"
                filter="url(#handleGlow)"
              />
              {/* Inner bright dot */}
              <circle cx={handleLoc.x} cy={handleYFromGain} r="3" fill="#c8daff" />
            </g>
          </svg>
        </div>

        {/* Divider — stronger than the grid lines, 2px compound treatment */}
        <div className="shrink-0">
          <div className="h-px bg-[#0a0a0c]" />
          <div className="h-px bg-[#2a2a2f]" />
        </div>

        {/* Bottom control strip — 20% height, slightly darker/sunken */}
        <div className="flex-1 bg-[#141417] flex items-center justify-center gap-20">
          <Controls
            qRotation={qRotation}
            gainRotation={gainRotation}
            freqRotation={freqRotation}
            bandSelected={bandSelected}
            setActiveKnob={setActiveKnob}
            handleKnobMouseDown={handleKnobMouseDown}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
