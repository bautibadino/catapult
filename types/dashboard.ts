import { GpsMetrics, MetricKey } from "./gps";

export interface KpiData {
  label: string;
  value: number;
  unit: string;
  sub: string;
  highlight?: boolean;
}

export interface RankingItem {
  rank: number;
  name: string;
  value: number;
  pj: number;
  max: number;
}

export interface MermaMetric {
  key: MetricKey;
  label: string;
  ptAvg: number;
  stAvg: number;
  delta: number;
  deltaPct: number;
  n: number;
}

export interface MermaPlayer {
  name: string;
  dist: number;
  m_min: number;
  z5: number;
  pl: number;
  top: number;
  n: number;
}

export interface BenchmarkItem {
  key: MetricKey;
  label: string;
  value: number;
  amateur: number;
  professional: number;
}

export interface SessionSummary {
  _id: string;
  name: string;
  date: string;
  rival?: string;
  athleteCount: number;
  promTotal: Partial<GpsMetrics>;
}

export interface DashboardData {
  kpis: KpiData[];
  sessions: SessionSummary[];
  rankings: {
    dist: RankingItem[];
    z5: RankingItem[];
    pl: RankingItem[];
  };
  athletes: {
    _id: string;
    name: string;
    pj: number;
    dur: number;
    dist: number;
    m_min: number;
    z5: number;
    top: number;
    a4: number;
    d4: number;
    pl: number;
  }[];
  merma: {
    metrics: MermaMetric[];
    mode: string;
    players: MermaPlayer[];
  };
  benchmarks: BenchmarkItem[];
  insights: { title: string; text: string }[];
}
