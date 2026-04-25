export function getKnobLinePoints({
  angle,
  r,
  cx,
  cy,
}: {
  angle: number;
  r: number;
  cx: number;
  cy: number;
}) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const lineInner = r * 0.38;
  const lineOuter = r * 0.78;

  return {
    x1: cx + Math.cos(rad) * lineInner,
    y1: cy + Math.sin(rad) * lineInner,
    x2: cx + Math.cos(rad) * lineOuter,
    y2: cy + Math.sin(rad) * lineOuter,
  };
}


export function getKnobArcPoints({
  angle,
  r,
  cx,
  cy,
}: {
  angle: number;
  r: number;
  cx: number;
  cy: number;
}) {
  const minDeg = -135;
  const maxDeg = 135;
  const arcR = r + 3.5;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  return {
    minDeg,
    maxDeg,
    arcR,
    asx: cx + arcR * Math.cos(toRad(minDeg)),
    asy: cy + arcR * Math.sin(toRad(minDeg)),
    aex: cx + arcR * Math.cos(toRad(angle)),
    aey: cy + arcR * Math.sin(toRad(angle)),
    tex: cx + arcR * Math.cos(toRad(maxDeg)),
    tey: cy + arcR * Math.sin(toRad(maxDeg)),
    fillLarge: angle - minDeg > 180 ? 1 : 0,
  };
}

export function getKnobLabelPositions({
  minDeg,
  maxDeg,
  arcR,
  cx,
  cy,
}: {
  minDeg: number;
  maxDeg: number;
  arcR: number;
  cx: number;
  cy: number;
}) {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const labelR = arcR + 7;

  return {
    minLx: cx + labelR * Math.cos(toRad(minDeg)),
    minLy: cy + labelR * Math.sin(toRad(minDeg)),
    maxLx: cx + labelR * Math.cos(toRad(maxDeg)),
    maxLy: cy + labelR * Math.sin(toRad(maxDeg)),
  };
}

export function getKnobVisuals({
  angle,
  r,
  cx,
  cy,
}: {
  angle: number;
  r: number;
  cx: number;
  cy: number;
}) {

  // Indicator line  
  const linePoints = getKnobLinePoints({ angle, r, cx, cy });

  // Arc: min = -135° (7 o'clock), max = 135° (5 o'clock)
  const arcPoints = getKnobArcPoints({ angle, r, cx, cy });
  
  // Min/max label positions — just outside the arc
  const labelPositions = getKnobLabelPositions({
    minDeg: arcPoints.minDeg,
    maxDeg: arcPoints.maxDeg,
    arcR: arcPoints.arcR,
    cx,
    cy,
  });

  return {
    ...linePoints,
    ...arcPoints,
    ...labelPositions,
  };
}