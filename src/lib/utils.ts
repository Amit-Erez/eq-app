import { MAX_FREQ, MIN_FREQ } from "../constants";

export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

// const MIN_FREQ = 10;
// const MAX_FREQ = 30000;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}


// 10Hz -> 0
// 30000Hz -> 1
export function freqToNormalized(freq: number) {
  const safeFreq = clamp(freq, MIN_FREQ, MAX_FREQ);

  return (
    (Math.log10(safeFreq) - Math.log10(MIN_FREQ)) /
    (Math.log10(MAX_FREQ) - Math.log10(MIN_FREQ))
  );
}

// 0 -> 10Hz
// 1 -> 30000Hz
export function normalizedToFreq(normalized: number) {
  const safeNormalized = clamp(normalized, 0, 1);

  return Math.pow(
    10,
    Math.log10(MIN_FREQ) +
      safeNormalized * (Math.log10(MAX_FREQ) - Math.log10(MIN_FREQ))
  );
}

// 0 -> left edge
// 1 -> right edge
export function normalizedToX(
  normalized: number,
  minX: number,
  maxX: number
) {
  const safeNormalized = clamp(normalized, 0, 1);
  return minX + safeNormalized * (maxX - minX);
}

// left edge -> 0
// right edge -> 1
export function xToNormalized(x: number, minX: number, maxX: number) {
  const safeX = clamp(x, minX, maxX);
  return (safeX - minX) / (maxX - minX);
}