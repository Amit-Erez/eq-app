export function getGainLabelValues({
  gainValue,
  handleX,
  handleYFromGain,
}: {
  gainValue: number;
  handleX: number;
  handleYFromGain: number;
}) {
  const gainLabel = `${Math.round(gainValue)} db`;
  const gainLabelWidth = Math.max(52, gainLabel.length * 6.8 + 12);
  const gainLabelX = Math.max(
    4,
    Math.min(800 - gainLabelWidth - 4, handleX - gainLabelWidth - 14),
  );
  const gainLabelY = handleYFromGain - 8;

  return { gainLabel, gainLabelWidth, gainLabelX, gainLabelY };
}

export function getFreqLabelValues({
  freqValue,
  handleX,
  handleYFromGain,
}: {
  freqValue: number;
  handleX: number;
  handleYFromGain: number;
}) {
  const freqLabel = `${Math.round(freqValue)} Hz`;
  const freqLabelWidth = Math.max(52, freqLabel.length * 6.8 + 12);
  const freqLabelX = Math.max(
    4,
    Math.min(800 - freqLabelWidth - 4, handleX - freqLabelWidth / 2),
  );
  const freqLabelY = handleYFromGain - 28;

  return { freqLabel, freqLabelWidth, freqLabelX, freqLabelY };
}