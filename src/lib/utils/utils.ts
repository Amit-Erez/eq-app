
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}


export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

