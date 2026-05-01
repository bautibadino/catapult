import { MetricKey } from "@/types/gps";

export const UNIT_MAP: Partial<Record<MetricKey, string>> = {
  dur: "min",
  dist: "m",
  m_min: "m/min",
  z3: "m",
  z4: "m",
  z5: "m",
  top_speed: "km/h",
  a23: "",
  a34: "",
  a4: "",
  d23: "",
  d34: "",
  d4: "",
  max_acc: "m/s²",
  max_dec: "m/s²",
  pl: "",
};

export function getUnit(metric: MetricKey): string {
  return UNIT_MAP[metric] || "";
}
