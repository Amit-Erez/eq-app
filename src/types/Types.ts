
export type Knob = "FREQ" | "GAIN" | "Q" | null

export type KnobsSpecs = {
  label: Knob;
  size: number;
  angle: number;
  min: string;
  max: string;
};


export type freqBand = {
  type: "bell" | "low-shelf" | "high-shelf";
  freqValue: number;
  gainValue: number;
  qValue: number;
  color: string;
};

