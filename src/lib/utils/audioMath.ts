import { visualMaxFreq, visualMinFreq } from "../../constants";
import type { freqBand } from "../../types/Types";
import { getBandShapeAmount, getBandVisualValues } from "./eqMath";

export function buildSpectrumPath(
  dataArray: Uint8Array,
  width: number,
  bottomY: number,
  baselineY: number,
  maxHeight: number,
  sampleRate: number,
  bandsArr: freqBand[],
) {
  if (!dataArray.length) return "";

  const nyquist = sampleRate / 2;

  let path = `M 0 ${bottomY}`;

  let prevX = 0;
  let prevY = baselineY;

  for (let x = 0; x <= width; x += 1) {
    const normalizedX = x / width;

    const freq =
      visualMinFreq * Math.pow(visualMaxFreq / visualMinFreq, normalizedX);

    const binIndex = Math.min(
      dataArray.length - 1,
      Math.floor((freq / nyquist) * dataArray.length),
    );

    const start = Math.max(0, binIndex - 2);
    const end = Math.min(dataArray.length - 1, binIndex + 2);

    let sum = 0;
    let count = 0;

    for (let i = start; i <= end; i++) {
      sum += dataArray[i];
      count++;
    }

    const value = sum / count;
    const normalized = value / 255;
    const curved = Math.log10(1 + normalized * 9);

    // const y = baselineY - curved * maxHeight;
    let eqOffset = 0;

    for (const band of bandsArr) {
      const { bandHandleX, bandGainHeight, bandWidth } = getBandVisualValues({
        freqValue: band.freqValue,
        gainValue: band.gainValue,
        qValue: band.qValue,
        graphMinX: 0,
        graphMaxX: width,
        maxGain: 30,
        maxBellHeight: 180,
      });

      const shape = getBandShapeAmount(x, bandHandleX, bandWidth, band.type);
      const EQ_VISUAL_STRENGTH = 0.4;

      eqOffset += shape * bandGainHeight *EQ_VISUAL_STRENGTH; 
    }

    const y = baselineY - curved * maxHeight - eqOffset;

    // midpoint for smoothing
    const midX = (prevX + x) / 2;
    const midY = (prevY + y) / 2;

    path += ` Q ${prevX} ${prevY} ${midX} ${midY}`;

    prevX = x;
    prevY = y;
  }

  path += ` L ${width} ${bottomY} Z`;

  return path;
}
