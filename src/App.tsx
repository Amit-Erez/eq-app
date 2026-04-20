import { cn } from "./lib/utils";

function App() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111113]">
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
                <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.15" />
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
            <g mask="url(#curveFade)">
              <path
                d="M 0 300 Q 200 300 320 290 Q 380 286 440 220 Q 480 170 500 155 Q 520 170 560 220 Q 600 270 660 288 Q 720 298 800 300 L 800 480 L 0 480 Z"
                fill="url(#bandFill)"
              />
              <path
                d="M 0 300 Q 200 300 320 290 Q 380 286 440 220 Q 480 170 500 155 Q 520 170 560 220 Q 600 270 660 288 Q 720 298 800 300"
                fill="none"
                stroke="#5b8cff"
                strokeWidth="1.5"
                strokeOpacity="0.65"
              />
            </g>

            {/* Handle — the draggable-looking control point */}
            <circle
              cx="500"
              cy="155"
              r="6"
              fill="#7aa8ff"
              filter="url(#handleGlow)"
            />
            {/* Inner bright dot */}
            <circle cx="500" cy="155" r="3" fill="#c8daff" />
          </svg>
        </div>

        {/* Divider — stronger than the grid lines, 2px compound treatment */}
        <div className="shrink-0">
          <div className="h-px bg-[#0a0a0c]" />
          <div className="h-px bg-[#2a2a2f]" />
        </div>

        {/* Bottom control strip — 20% height, slightly darker/sunken */}
        <div className="flex-[1] bg-[#141417]" />
      </div>
    </div>
  );
}

export default App;
