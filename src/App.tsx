import { useState } from "react";
import { cn } from "./lib/utils";

type Location = { x: number; y: number };

function App() {
  // ====================
  // State
  // ====================
  const [handleLoc, setHandleLoc] = useState<Location>({ x: 500, y: 155 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [qRotation, setQRotation] = useState<number>(60);
  const [qLastY, setQLastY] = useState<number>(0);
  const [activeKnob, setActiveKnob] = useState<string | null>(null);

  // ====================
  // Constants (no dependencies)
  // ====================
  const baselineY = 300;
  const minQ = 0.025;
  const maxQ = 40;
  const minWidth = 8;
  const maxWidth = 100;
  const minAngle = -135;
  const maxAngle = 135;

  // ====================
  // Derived from state (rotation → Q)
  // ====================
  const normalizedRotation = (qRotation - minAngle) / (maxAngle - minAngle);

  const mappedQ = minQ + normalizedRotation * (maxQ - minQ);

  // ====================
  // Derived from Q (Q → width)
  // ====================
  const normalizedQ = (mappedQ - minQ) / (maxQ - minQ);

  const inverted = 1 - normalizedQ;

  const range = maxWidth - minWidth;

  const width = minWidth + inverted * range;

  // ====================
  // Curve inputs
  // ====================
  const centerX = handleLoc.x;
  const gainHeight = baselineY - handleLoc.y;

  // ====================
  // Path generation
  // ====================
  let path = `M 0 ${baselineY}`;

  for (let x = 0; x <= 800; x += 4) {
    const dx = x - centerX;
    const bell = Math.exp(-(dx * dx) / (2 * width * width));
    const y = baselineY - gainHeight * bell;
    path += ` L ${x} ${y}`;
  }

  // ====================
  // Handlers
  // ====================
  function handleClick(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const graphX = (x / rect.width) * 800;
    const graphY = (y / rect.height) * 480;
    setHandleLoc({ x: graphX, y: graphY });
  }

  function handleKnobMouseDown(e: React.MouseEvent<HTMLElement>) {
    setIsDragging(true);
    setQLastY(e.clientY);
  }

  function handleMouseDrag(e: React.MouseEvent<HTMLElement>) {
    if (!isDragging) return;

    if (activeKnob === "Q") {
      const sensitivity = 1;
      const currQY = e.clientY;
      const deltaY = currQY - qLastY;
      setQRotation((prev) => {
        const next = prev - deltaY * sensitivity;
        if (next > 135) return 135;
        if (next < -135) return -135;

        return next;
      });

      setQLastY(currQY);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#111113] select-none"
      onMouseMove={(e) => isDragging && handleMouseDrag(e)}
      onMouseUp={() => setIsDragging(false)}
    >
      <div
        className={cn(
          "w-[70%] max-w-[800px] h-[600px]",
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
          className="flex-[3] relative overflow-hidden"
          style={{
            // Top-to-bottom gradient: slightly lifted top, darker toward the divider
            background: "linear-gradient(to bottom, #1f1f24 0%, #18181c 100%)",
          }}
          onClick={handleClick}
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
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 800 480"
          >
            <defs>
              {/* Vertical fill gradient (top opacity → transparent at bottom) */}
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#5b8cff" stopOpacity="0.0" />
              </linearGradient>
              {/* Horizontal fade mask — full opacity in center, fades to 0 on both edges */}
              <linearGradient id="fadeMask" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="20%" stopColor="white" stopOpacity="1" />
                <stop offset="80%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id="curveFade">
                <rect
                  x="0"
                  y="0"
                  width="800"
                  height="480"
                  fill="url(#fadeMask)"
                />
              </mask>
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
            <path d={`${path} L 800 480 L 0 480 Z`} fill="url(#bandFill)" />
            <path
              d={path}
              fill="none"
              stroke="#5b8cff"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />

            {/* Handle — the draggable-looking control point */}
            <circle
              cx={handleLoc.x}
              cy={handleLoc.y}
              r="6"
              fill="#7aa8ff"
              filter="url(#handleGlow)"
            />
            {/* Inner bright dot */}
            <circle cx={handleLoc.x} cy={handleLoc.y} r="3" fill="#c8daff" />
          </svg>
        </div>

        {/* Divider — stronger than the grid lines, 2px compound treatment */}
        <div className="shrink-0">
          <div className="h-px bg-[#0a0a0c]" />
          <div className="h-px bg-[#2a2a2f]" />
        </div>

        {/* Bottom control strip — 20% height, slightly darker/sunken */}
        <div className="flex-[1] bg-[#141417] flex items-center justify-center gap-20">
          {/* Knob component — inline, visual only */}
          {[
            {
              label: "FREQ",
              size: 28,
              angle: -40,
              min: "10 Hz",
              max: "30 kHz",
            },
            { label: "GAIN", size: 34, angle: 20, min: "-30", max: "+30" },
            { label: "Q", size: 28, angle: qRotation, min: "0.025", max: "40" },
          ].map(({ label, size, angle, min, max }) => {
            const r = size;
            const cx = r + 6;
            const cy = r + 6;
            const svgSize = (r + 6) * 2;

            // Indicator line
            const rad = ((angle - 90) * Math.PI) / 180;
            const lineInner = r * 0.38;
            const lineOuter = r * 0.78;
            const x1 = cx + Math.cos(rad) * lineInner;
            const y1 = cy + Math.sin(rad) * lineInner;
            const x2 = cx + Math.cos(rad) * lineOuter;
            const y2 = cy + Math.sin(rad) * lineOuter;

            // Arc: min = -135° (7 o'clock), max = 135° (5 o'clock)
            const minDeg = -135;
            const maxDeg = 135;
            const arcR = r + 3.5;
            const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
            const asx = cx + arcR * Math.cos(toRad(minDeg));
            const asy = cy + arcR * Math.sin(toRad(minDeg));
            const aex = cx + arcR * Math.cos(toRad(angle));
            const aey = cy + arcR * Math.sin(toRad(angle));
            const tex = cx + arcR * Math.cos(toRad(maxDeg));
            const tey = cy + arcR * Math.sin(toRad(maxDeg));
            const fillLarge = angle - minDeg > 180 ? 1 : 0;

            // Min/max label positions — just outside the arc
            const labelR = arcR + 7;
            const minLx = cx + labelR * Math.cos(toRad(minDeg));
            const minLy = cy + labelR * Math.sin(toRad(minDeg));
            const maxLx = cx + labelR * Math.cos(toRad(maxDeg));
            const maxLy = cy + labelR * Math.sin(toRad(maxDeg));

            return (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5"
                onMouseDown={(e) => {
                  setActiveKnob(label);
                  handleKnobMouseDown(e);
                }}
              >
                <svg
                  width={svgSize}
                  height={svgSize}
                  viewBox={`0 0 ${svgSize} ${svgSize}`}
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <radialGradient
                      id={`knobGrad-${label}`}
                      cx="40%"
                      cy="35%"
                      r="65%"
                    >
                      <stop offset="0%" stopColor="#2e2e35" />
                      <stop offset="100%" stopColor="#19191d" />
                    </radialGradient>
                    <filter
                      id={`knobGlow-${label}`}
                      x="-60%"
                      y="-60%"
                      width="220%"
                      height="220%"
                    >
                      <feGaussianBlur stdDeviation={r * 0.45} result="blur" />
                      <feComposite
                        in="blur"
                        in2="SourceGraphic"
                        operator="over"
                      />
                    </filter>
                    <filter
                      id={`arcBlur-${label}`}
                      x="-30%"
                      y="-30%"
                      width="160%"
                      height="160%"
                    >
                      <feGaussianBlur stdDeviation="1" />
                    </filter>
                  </defs>

                  {/* Soft aura */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#5b8cff"
                    opacity="0.07"
                    filter={`url(#knobGlow-${label})`}
                  />
                  {/* Knob base */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={`url(#knobGrad-${label})`}
                    stroke="#0d0d10"
                    strokeWidth="1"
                  />
                  {/* Inner rim highlight */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r - 1}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  {/* Indicator line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#7aa8ff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                  {/* Track arc — full range, very faint */}
                  <path
                    d={`M ${asx} ${asy} A ${arcR} ${arcR} 0 1 1 ${tex} ${tey}`}
                    fill="none"
                    stroke="#3a5fcc"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.10"
                  />
                  {/* Fill arc — min to current angle */}
                  <path
                    d={`M ${asx} ${asy} A ${arcR} ${arcR} 0 ${fillLarge} 1 ${aex} ${aey}`}
                    fill="none"
                    stroke="#7aa8ff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.35"
                    filter={`url(#arcBlur-${label})`}
                  />
                  {/* Min label — 7 o'clock */}
                  <text
                    x={minLx}
                    y={minLy}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="rgba(255,255,255,0.22)"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="0.02em"
                  >
                    {min}
                  </text>
                  {/* Max label — 5 o'clock */}
                  <text
                    x={maxLx}
                    y={maxLy}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="rgba(255,255,255,0.22)"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="0.02em"
                  >
                    {max}
                  </text>
                </svg>

                <span
                  className="text-[10.5px] tracking-widest font-medium"
                  style={{
                    color: "rgba(255,255,255,0.40)",
                    letterSpacing: "0.18em",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
