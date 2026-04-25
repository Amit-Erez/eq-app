import type { freqBand, Knob, KnobsSpecs } from "../types/Types";
import { useRef, useState } from "react";
import { MAX_FREQ, maxGain, MIN_FREQ, minGain } from "../constants";
import {
  getKnobVisuals,
} from "../lib/utils/knobMath";

function Controls({
  bandsArr,
  qRotation,
  gainRotation,
  freqKnobRotation,
  knobDblClicked,
  selectedBandIndex,
  setKnobDblClicked,
  setActiveKnob,
  setIsFreqKnobHovered,
  setIsGainKnobHovered,
  handleKnobMouseDown,
  updateBands,
}: {
  bandsArr: freqBand[];
  qRotation: number;
  gainRotation: number;
  freqKnobRotation: number;
  knobDblClicked: "FREQ" | "GAIN" | null;
  selectedBandIndex: number | null;
  updateBands: (key: string, value: number) => void;
  setKnobDblClicked: (label: "FREQ" | "GAIN" | null) => void;
  setActiveKnob: (label: Knob) => void;
  setIsFreqKnobHovered: (isHovered: boolean) => void;
  setIsGainKnobHovered: (isHovered: boolean) => void;
  handleKnobMouseDown: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}) {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [freqInputValue, setFreqInputValue] = useState<string>("");
  const [gainInputValue, setGainInputValue] = useState<string>("");

  const knobs: KnobsSpecs[] = [
    {
      label: "FREQ",
      size: 28,
      angle: freqKnobRotation ? freqKnobRotation : 0,
      min: "10 Hz",
      max: "30 kHz",
    },
    {
      label: "GAIN",
      size: 34,
      angle: gainRotation ? gainRotation : 0,
      min: "-30",
      max: "+30",
    },
    {
      label: "Q",
      size: 28,
      angle: qRotation ? qRotation : 0,
      min: "0.025",
      max: "40",
    },
  ];

  function handleDoubleClick(label: Knob) {
    if (label === "Q") return;

    setKnobDblClicked(label);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    setActiveKnob(label);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (knobDblClicked === "FREQ") {
      setFreqInputValue(e.target.value);
    } else if (knobDblClicked === "GAIN") {
      setGainInputValue(e.target.value);
    }
  }

  function handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const parsed = Number(e.currentTarget.value);
    if (Number.isNaN(parsed)) return;

    if (knobDblClicked === "FREQ") {
      const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, parsed));
      updateBands("freqValue", clamped);
      setFreqInputValue("");
      setKnobDblClicked(null);
      return;
    }

    if (knobDblClicked === "GAIN") {
      const clamped = Math.max(minGain, Math.min(maxGain, parsed));
      updateBands("gainValue", clamped);
      setGainInputValue("");
      setKnobDblClicked(null);
      return;
    }
  }

  return (
    <>
      {knobs.map(({ label, size, angle, min, max }) => {
        const r = size;
        const cx = r + 6;
        const cy = r + 6;
        const svgSize = (r + 6) * 2;

        const {
          x1,
          y1,
          x2,
          y2,
          arcR,
          asx,
          asy,
          aex,
          aey,
          tex,
          tey,
          fillLarge,
          minLx,
          minLy,
          maxLx,
          maxLy,
        } = getKnobVisuals({ angle, r, cx, cy });


        return (
          <div
            ref={label === knobDblClicked ? knobRef : null}
            key={label}
            className="relative flex flex-col items-center gap-1.5"
            onMouseEnter={() => {
              if (label === "FREQ") setIsFreqKnobHovered(true);
              if (label === "GAIN") setIsGainKnobHovered(true);
            }}
            onMouseLeave={() => {
              if (label === "FREQ") setIsFreqKnobHovered(false);
              if (label === "GAIN") setIsGainKnobHovered(false);
            }}
            onMouseDown={(e) => {
              setActiveKnob(label);
              handleKnobMouseDown(e);
            }}
            onDoubleClick={() => handleDoubleClick(label)}
          >
            {label === knobDblClicked ? (
              <input
                ref={inputRef}
                type="text"
                inputMode={label === "FREQ" ? "numeric" : "decimal"}
                value={label === "FREQ" ? freqInputValue : gainInputValue}
                onChange={handleInputChange}
                onKeyUp={handleInputKeyUp}
                maxLength={label === "FREQ" ? 5 : 4}
                className="absolute bottom-full mb-1 left-1/2 z-10 w-14 -translate-x-1/2 rounded bg-black px-1 text-center text-[10px] text-gray-400 outline-none"
              />
            ) : null}
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              style={{ overflow: "visible" }}
              className="hover:brightness-110 hover:cursor-grab active:brightness-110 transition-all duration-150"
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
                  <feComposite in="blur" in2="SourceGraphic" operator="over" />
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

              <path
                d={`M ${asx} ${asy} A ${arcR} ${arcR} 0 ${fillLarge} 1 ${aex} ${aey}`}
                fill="none"
                stroke={bandsArr[selectedBandIndex!].color}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.5"
                filter={`url(#arcBlur-${label})`}
                className="group-hover:opacity-100 transition-opacity duration-150"
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
    </>
  );
}

export default Controls;
