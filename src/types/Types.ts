export type Location = { x: number; y: number };

export type Knob = "FREQ" | "GAIN" | "Q" | null

export type KnobsSpecs = {
  label: Knob;
  size: number;
  angle: number;
  min: string;
  max: string;
};

export type BandNumber = 1 | 2 | 3 | 4 | 5 | 6 | null

export type freqBand = {
  type: "bell" | "low-shelf" | "high-shelf";
  freqValue: number;
  gainValue: number;
  qValue: number;
};

