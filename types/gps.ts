export interface GpsMetrics {
  dur: number;
  dist: number;
  m_min: number;
  z3: number;
  z4: number;
  z5: number;
  top_speed: number;
  a23: number;
  a34: number;
  a4: number;
  d23: number;
  d34: number;
  d4: number;
  max_acc: number;
  max_dec: number;
  pl: number;
}

export interface GpsRecordDoc {
  _id: string;
  athleteId: string;
  athleteName: string;
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  team?: string;
  position?: string;
  half?: "Full" | "1st Half" | "2nd Half";
  metrics: GpsMetrics;
  rawRow: Record<string, unknown>;
  sourceFileId: string;
  rowHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDoc {
  _id: string;
  name: string;
  date: string;
  rival?: string;
  team: string;
  athleteCount: number;
  metricsSummary?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AthleteDoc {
  _id: string;
  name: string;
  normalizedName: string;
  team?: string;
  position?: string;
  sessionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportFileDoc {
  _id: string;
  fileName: string;
  fileHash: string;
  rowCount: number;
  importedCount: number;
  errors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type MetricKey = keyof GpsMetrics;

export const METRIC_LABELS: Record<MetricKey, string> = {
  dur: "Duración (min)",
  dist: "Distancia total (m)",
  m_min: "m/min",
  z3: "Z3 Distancia (m)",
  z4: "Z4 Distancia (m)",
  z5: "Sprints Z5 (m)",
  top_speed: "Top Speed (km/h)",
  a23: "Acc 2-3 m/s²",
  a34: "Acc 3-4 m/s²",
  a4: "Acc >4 m/s²",
  d23: "Dec 2-3 m/s²",
  d34: "Dec 3-4 m/s²",
  d4: "Dec >4 m/s²",
  max_acc: "Max Acc (m/s²)",
  max_dec: "Max Dec (m/s²)",
  pl: "Player Load",
};

export const METRIC_UNITS: Partial<Record<MetricKey, string>> = {
  dur: "min",
  dist: "m",
  m_min: "m/min",
  z3: "m",
  z4: "m",
  z5: "m",
  top_speed: "km/h",
  a23: "count",
  a34: "count",
  a4: "count",
  d23: "count",
  d34: "count",
  d4: "count",
  max_acc: "m/s²",
  max_dec: "m/s²",
  pl: "",
};
