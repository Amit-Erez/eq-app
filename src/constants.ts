import type { freqBand } from "./types/Types";

  // Geometry
  export const baselineY = 260;
  export const maxBellHeight = 180;
  export const minWidth = 8; // bell width at max Q
  export const maxWidth = 100; // bell width at min Q

  // Q
  export const minQ = 0.025;
  export const maxQ = 40;

  // Gain
  export const minGain = -30;
  export const maxGain = 30;

  // Knob
  export const minAngle = -135;
  export const maxAngle = 135;

  // FREQ 
  export const MIN_FREQ = 10;
  export const MAX_FREQ = 30000;
  export const graphMinX = 0;
  export const graphMaxX = 800;

  export const freqMarkers = [
    10, 20, 40, 80, 160, 300, 400, 500, 650, 1000, 2500, 5000, 8000, 10000, 20000,
  ]

  export const majorIndexes = [2, 4, 8, 10, 11, 13];

 export const bands: freqBand[] = [
      {type: "low-shelf", freqValue: 40, gainValue: 0, qValue: 20, color: "#fff"},
      {type: "bell", freqValue: 160, gainValue: 0, qValue: 20, color: "#A378C6"}, 
      {type: "bell", freqValue: 650, gainValue: 0, qValue: 20, color: "#5b8cff"},
      {type: "bell", freqValue: 2500, gainValue: 0, qValue: 20, color: "#85C272"},
      {type: "bell", freqValue: 5000, gainValue: 0, qValue: 20, color: "#F2B34B"},
      {type: "high-shelf", freqValue: 10000, gainValue: 0, qValue: 20, color: "#fff"},
    ]