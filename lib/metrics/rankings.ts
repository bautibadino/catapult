import { MetricKey, GpsMetrics } from "@/types/gps";

export function rankByMetric<T extends { metrics: GpsMetrics }>(
  items: T[],
  metric: MetricKey,
  descending = true
): (T & { rank: number; value: number })[] {
  const withValue = items.map((item) => ({
    ...item,
    value: item.metrics[metric],
  }));

  withValue.sort((a, b) => (descending ? b.value - a.value : a.value - b.value));

  return withValue.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

export function getTopN<T>(items: T[], n: number): T[] {
  return items.slice(0, n);
}
