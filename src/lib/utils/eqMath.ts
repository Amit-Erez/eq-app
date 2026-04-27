import {
  MAX_FREQ,
  maxQ,
  maxWidth,
  MIN_FREQ,
  minQ,
  minWidth,
} from "../../constants";
import type { freqBand } from "../../types/Types";
import { clamp } from "./utils";

// *******************
// Basic converters
// *******************

// 10Hz -> 0 ... 30000Hz -> 1
export function freqToNormalized(freq: number) {
  const safeFreq = clamp(freq, MIN_FREQ, MAX_FREQ);

  return (
    (Math.log10(safeFreq) - Math.log10(MIN_FREQ)) /
    (Math.log10(MAX_FREQ) - Math.log10(MIN_FREQ))
  );
}

// 0 -> 10Hz ... 1 -> 30000Hz
export function normalizedToFreq(normalized: number) {
  const safeNormalized = clamp(normalized, 0, 1);

  return Math.pow(
    10,
    Math.log10(MIN_FREQ) +
      safeNormalized * (Math.log10(MAX_FREQ) - Math.log10(MIN_FREQ)),
  );
}

// 0 -> left edge ... 1 -> right edge
export function normalizedToX(normalized: number, minX: number, maxX: number) {
  const safeNormalized = clamp(normalized, 0, 1);
  return minX + safeNormalized * (maxX - minX);
}

// left edge -> 0 ... right edge -> 1
export function xToNormalized(x: number, minX: number, maxX: number) {
  const safeX = clamp(x, minX, maxX);
  return (safeX - minX) / (maxX - minX);
}

// *************************
// Simple derived helpers
// *************************

export function getMarkerPositions(
  freqMarkers: number[],
  graphMinX: number,
  graphMaxX: number
) {
  return freqMarkers.map((freq) =>
    normalizedToX(freqToNormalized(freq), graphMinX, graphMaxX)
  );
}

// Q → width
export function qToCurveWidth(qValue: number) {
  const normalizedQ = (qValue - minQ) / (maxQ - minQ);
  const invertedQ = 1 - normalizedQ;
  return minWidth + invertedQ * (maxWidth - minWidth);
}

// Freq -> x coordinate on graph
export function freqToX(freqValue: number, minX: number, maxX: number) {
  const bandNormalizedFreq = freqToNormalized(freqValue);
  return normalizedToX(bandNormalizedFreq, minX, maxX);
}

// Gain -> height
export function gainToHeight(
  gainValue: number,
  maxGain: number,
  maxHeight: number,
) {
  const signedGain = gainValue / maxGain;
  return signedGain * maxHeight;
}

// ********************
// Shape/path helpers
// ********************

export function getBandShapeAmount(
  x: number,
  bandHandleX: number,
  bandWidth: number,
  bandType: "low-shelf" | "bell" | "high-shelf",
) {
  const dx = x - bandHandleX;
  const slope = bandWidth / 2;

  const bell = Math.exp(-(dx * dx) / (2 * bandWidth * bandWidth));
  const lowShelf = 1 / (1 + Math.exp((x - bandHandleX) / slope));
  const highShelf = 1 / (1 + Math.exp((bandHandleX - x) / slope));

  if (bandType === "low-shelf") return lowShelf;
  if (bandType === "high-shelf") return highShelf;

  return bell;
}

export function buildBandPath({
  baselineY,
  bandHandleX,
  bandWidth,
  bandGainHeight,
  bandType,
}: {
  baselineY: number;
  bandHandleX: number;
  bandWidth: number;
  bandGainHeight: number;
  bandType: "low-shelf" | "bell" | "high-shelf";
}) {
  let path = `M 0 ${baselineY}`;

  for (let x = 0; x <= 800; x += 4) {
    const shape = getBandShapeAmount(x, bandHandleX, bandWidth, bandType);
    const y = baselineY - bandGainHeight * shape;

    path += ` L ${x} ${y}`;
  }

  return path;
}

// ******************
// Composed helpers
// ******************

export function getBandVisualValues({
  freqValue,
  gainValue,
  qValue,
  graphMinX,
  graphMaxX,
  maxGain,
  maxBellHeight,
}: {
  freqValue: number;
  gainValue: number;
  qValue: number;
  graphMinX: number;
  graphMaxX: number;
  maxGain: number;
  maxBellHeight: number;
}) {
  const bandHandleX = freqToX(freqValue, graphMinX, graphMaxX);

  const bandGainHeight = gainToHeight(
    gainValue,
    maxGain,
    maxBellHeight
  );

  const bandWidth = qToCurveWidth(qValue);

  return {
    bandHandleX,
    bandGainHeight,
    bandWidth,
  };
}

export function getSelectedBandValues({
  band,
  graphMinX,
  graphMaxX,
  maxGain,
  maxBellHeight,
  baselineY,
  minAngle,
  maxAngle,
}: {
  band: freqBand;
  graphMinX: number;
  graphMaxX: number;
  maxGain: number;
  maxBellHeight: number;  
  baselineY: number;
  minAngle: number;
  maxAngle: number;
}){

const normalizedFreq = freqToNormalized(band.freqValue);
const handleX = normalizedToX(normalizedFreq, graphMinX, graphMaxX);
const freqKnobRotation = minAngle + normalizedFreq * (maxAngle - minAngle);

const selectedNormalizedQ =
  (band.qValue - minQ) / (maxQ - minQ);

const qRotation = minAngle + selectedNormalizedQ * (maxAngle - minAngle);

const signedGain = band.gainValue / maxGain;
const gainHeightFromKnob = signedGain * maxBellHeight;
const handleYFromGain = baselineY - gainHeightFromKnob;
const gainRotation = band.gainValue * 4.5;

  return {
  handleX,
  handleYFromGain,
  freqKnobRotation,
  qRotation,
  gainRotation
  }
}

export function getBandVisuals({
  freqValue,
  gainValue,
  qValue,
  bandType,
  graphMinX,
  graphMaxX,
  maxGain,
  maxBellHeight,
  baselineY,
}: {
  freqValue: number;
  gainValue: number;
  qValue: number;
  bandType: "low-shelf" | "bell" | "high-shelf";
  graphMinX: number;
  graphMaxX: number;
  maxGain: number;
  maxBellHeight: number;
  baselineY: number;
}) {
  const { bandHandleX, bandGainHeight, bandWidth } = getBandVisualValues({
    freqValue,
    gainValue,
    qValue,
    graphMinX,
    graphMaxX,
    maxGain,
    maxBellHeight,
  });

  const bandPath = buildBandPath({
    baselineY,
    bandHandleX,
    bandWidth,
    bandGainHeight,
    bandType,
  });

  return {
    bandHandleX,
    bandGainHeight,
    bandWidth,
    bandPath,
  };
}


