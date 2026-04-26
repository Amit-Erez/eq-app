
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

export type CurveLineProps = {
  band: freqBand;
  fillId: string;
  index: number;
  bandPath: string;
  baselineY: number;
  selectedBandIndex: number;
  showFreqLabel: boolean;
  freqLabelX: number;
  freqLabelY: number;
  freqLabelWidth: number;
  freqLabel: string;
  showGainLabel: boolean;
  gainLabelX: number;
  gainLabelY: number;
  gainLabelWidth: number;
  gainLabel: string;
};

export type handleProps = {
  band: freqBand;
  index: number;
  bandHandleX: number;
  bandHandleY: number;
  setHoveredBandIndex: (index: number | null) => void;
  setSelectedBandIndex: (index: number | null) => void;
  setIsHandleDragging: (isDragging: boolean) => void;
};

