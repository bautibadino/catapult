export function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

export function sum(arr: number[]): number {
  return arr.reduce((s, x) => s + x, 0);
}

export function max(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
}

export function min(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.min(...arr);
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - idx) + sorted[upper] * (idx - lower);
}

export function deltaPct(a: number, b: number): number {
  if (a === 0) return 0;
  return ((b - a) / a) * 100;
}
