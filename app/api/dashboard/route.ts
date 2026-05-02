import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GpsRecord } from "@/models/gps-record";
import { Session } from "@/models/session";
import { avg, sum, deltaPct } from "@/lib/metrics/aggregate";
import { MetricKey } from "@/types/gps";

const BENCHMARKS: Record<string, { label: string; amateur: number; professional: number }> = {
  dist: { label: "Distancia total (m)", amateur: 8500, professional: 10500 },
  m_min: { label: "m/min", amateur: 95, professional: 110 },
  z5: { label: "Sprints Z5 (m)", amateur: 60, professional: 180 },
  top_speed: { label: "Top Speed (km/h)", amateur: 29, professional: 32 },
  pl: { label: "Player Load", amateur: 350, professional: 450 },
};

function getMetricsArray(records: any[], key: MetricKey) {
  return records.map((r) => r.metrics[key] || 0);
}

interface MatchAggregate {
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

function aggregateMatch(records: any[]): MatchAggregate {
  // Sum cumulative metrics, max for peaks, weighted avg for rates
  const dur = sum(records.map((r) => r.metrics.dur));
  const dist = sum(records.map((r) => r.metrics.dist));
  const z3 = sum(records.map((r) => r.metrics.z3));
  const z4 = sum(records.map((r) => r.metrics.z4));
  const z5 = sum(records.map((r) => r.metrics.z5));
  const a23 = sum(records.map((r) => r.metrics.a23));
  const a34 = sum(records.map((r) => r.metrics.a34));
  const a4 = sum(records.map((r) => r.metrics.a4));
  const d23 = sum(records.map((r) => r.metrics.d23));
  const d34 = sum(records.map((r) => r.metrics.d34));
  const d4 = sum(records.map((r) => r.metrics.d4));
  const pl = sum(records.map((r) => r.metrics.pl));
  const top_speed = Math.max(...records.map((r) => r.metrics.top_speed || 0));
  const max_acc = Math.max(...records.map((r) => r.metrics.max_acc || 0));
  const max_dec = Math.max(...records.map((r) => r.metrics.max_dec || 0));

  // m/min should be recalculated from totals (not averaged)
  const m_min = dur > 0 ? dist / dur : 0;

  return { dur, dist, m_min, z3, z4, z5, top_speed, a23, a34, a4, d23, d34, d4, max_acc, max_dec, pl };
}

export async function GET() {
  try {
    await connectDB();

    const sessions = await Session.find().sort({ date: 1 }).lean();
    const allRecords = await GpsRecord.find().lean();

    if (allRecords.length === 0) {
      return NextResponse.json({
        kpis: [],
        sessions: [],
        rankings: { dist: [], z5: [], pl: [] },
        athletes: [],
        merma: { metrics: [], mode: "completos", players: [] },
        benchmarks: [],
        insights: [],
      });
    }

    // All records regardless of half — we aggregate by session
    const ptRecords = allRecords.filter((r) => r.half === "1st Half");
    const stRecords = allRecords.filter((r) => r.half === "2nd Half");

    // --- ATHLETE AGGREGATION BY MATCH ---
    // athleteName -> sessionId -> records[]
    const athleteSessionMap: Record<string, Record<string, any[]>> = {};
    for (const r of allRecords) {
      const name = r.athleteName;
      const sid = String(r.sessionId);
      if (!athleteSessionMap[name]) athleteSessionMap[name] = {};
      if (!athleteSessionMap[name][sid]) athleteSessionMap[name][sid] = [];
      athleteSessionMap[name][sid].push(r);
    }

    const athletes = Object.entries(athleteSessionMap).map(([name, sessionMap]) => {
      const matchAggregates = Object.values(sessionMap).map((records) => aggregateMatch(records));
      const firstRecord = Object.values(sessionMap)[0]?.[0];

      return {
        _id: String(firstRecord?.athleteId || ""),
        name,
        pj: matchAggregates.length, // unique sessions = matches played
        dur: avg(matchAggregates.map((m) => m.dur)),
        dist: avg(matchAggregates.map((m) => m.dist)),
        m_min: avg(matchAggregates.map((m) => m.m_min)),
        z5: avg(matchAggregates.map((m) => m.z5)),
        top: Math.max(...matchAggregates.map((m) => m.top_speed)),
        a4: avg(matchAggregates.map((m) => m.a4)),
        d4: avg(matchAggregates.map((m) => m.d4)),
        pl: avg(matchAggregates.map((m) => m.pl)),
      };
    });

    // --- KPIs (from match aggregates) ---
    const allMatchAggs: MatchAggregate[] = [];
    for (const sessionMap of Object.values(athleteSessionMap)) {
      for (const records of Object.values(sessionMap)) {
        allMatchAggs.push(aggregateMatch(records));
      }
    }

    const distAvg = avg(allMatchAggs.map((m) => m.dist));
    const mminAvg = avg(allMatchAggs.map((m) => m.m_min));
    const z5Avg = avg(allMatchAggs.map((m) => m.z5));
    const topAvg = avg(allMatchAggs.map((m) => m.top_speed));
    const plAvg = avg(allMatchAggs.map((m) => m.pl));

    const kpis = [
      { label: "Distancia / partido", value: distAvg / 1000, unit: "km", sub: `${mminAvg.toFixed(1)} m/min · promedio`, highlight: true },
      { label: "Sprints Z5", value: z5Avg, unit: "m", sub: "distancia >25.2 km/h por partido" },
      { label: "Top Speed promedio", value: topAvg, unit: "km/h", sub: "velocidad máxima del equipo" },
      { label: "Player Load", value: plAvg, unit: "", sub: "carga mecánica promedio" },
      { label: "Plantel", value: athletes.length, unit: "", sub: "jugadores con datos" },
    ];

    // --- SESSION SUMMARIES ---
    const sessionSummaries = sessions
      .map((s) => {
        const sRecords = allRecords.filter((r) => String(r.sessionId) === String(s._id));
        // Aggregate per-athlete within session for cleaner averages
        const sessionAthleteMap: Record<string, any[]> = {};
        for (const r of sRecords) {
          if (!sessionAthleteMap[r.athleteName]) sessionAthleteMap[r.athleteName] = [];
          sessionAthleteMap[r.athleteName].push(r);
        }
        const matchAggs = Object.values(sessionAthleteMap).map((recs) => aggregateMatch(recs));

        return {
          _id: String(s._id),
          name: s.name,
          date: s.date,
          rival: s.rival,
          athleteCount: matchAggs.length,
          promTotal: {
            dist: avg(matchAggs.map((m) => m.dist)),
            m_min: avg(matchAggs.map((m) => m.m_min)),
            z5: avg(matchAggs.map((m) => m.z5)),
            top_speed: avg(matchAggs.map((m) => m.top_speed)),
            a4: avg(matchAggs.map((m) => m.a4)),
            d4: avg(matchAggs.map((m) => m.d4)),
            pl: avg(matchAggs.map((m) => m.pl)),
          },
        };
      })
      .filter((s) => s.athleteCount > 0);

    // --- RANKINGS ---
    function makeRanking(key: "dist" | "z5" | "pl") {
      const sorted = [...athletes].sort((a, b) => (b as any)[key] - (a as any)[key]);
      const maxV = sorted[0] ? (sorted[0] as any)[key] : 1;
      return sorted.slice(0, 8).map((a, i) => ({
        rank: i + 1,
        name: a.name,
        value: (a as any)[key],
        pj: a.pj,
        max: maxV,
      }));
    }

    const rankings = {
      dist: makeRanking("dist"),
      z5: makeRanking("z5"),
      pl: makeRanking("pl"),
    };

    // --- MERMA ---
    const metricsDef: { key: MetricKey; label: string }[] = [
      { key: "dist", label: "Distancia (m)" },
      { key: "m_min", label: "m/min" },
      { key: "z5", label: "Sprints Z5 (m)" },
      { key: "a4", label: "Acc >4 m/s²" },
      { key: "d4", label: "Dec >4 m/s²" },
      { key: "top_speed", label: "Top Speed (km/h)" },
      { key: "pl", label: "Player Load" },
    ];

    const mermaMetrics = metricsDef.map((m) => {
      const ptVals = getMetricsArray(ptRecords, m.key);
      const stVals = getMetricsArray(stRecords, m.key);
      const ptAvg = avg(ptVals);
      const stAvg = avg(stVals);
      return {
        key: m.key,
        label: m.label,
        ptAvg,
        stAvg,
        delta: stAvg - ptAvg,
        deltaPct: deltaPct(ptAvg, stAvg),
        n: ptVals.length,
      };
    });

    // Player-level merma
    const playerMermaMap: Record<string, { dist: number[]; m_min: number[]; z5: number[]; pl: number[]; top: number[]; n: number }> = {};
    const sessionIds = Array.from(new Set(allRecords.map((r) => String(r.sessionId))));
    for (const sid of sessionIds) {
      const ptR = ptRecords.filter((r) => String(r.sessionId) === sid);
      const stR = stRecords.filter((r) => String(r.sessionId) === sid);
      const ptNames = new Set(ptR.map((r) => r.athleteName));
      const stNames = new Set(stR.map((r) => r.athleteName));
      const both = Array.from(ptNames).filter((n) => stNames.has(n));
      for (const name of both) {
        const pt = ptR.find((r) => r.athleteName === name);
        const st = stR.find((r) => r.athleteName === name);
        if (!pt || !st) continue;
        if (!playerMermaMap[name]) playerMermaMap[name] = { dist: [], m_min: [], z5: [], pl: [], top: [], n: 0 };
        playerMermaMap[name].dist.push(deltaPct(pt.metrics.dist, st.metrics.dist));
        playerMermaMap[name].m_min.push(deltaPct(pt.metrics.m_min, st.metrics.m_min));
        playerMermaMap[name].z5.push(deltaPct(pt.metrics.z5, st.metrics.z5));
        playerMermaMap[name].pl.push(deltaPct(pt.metrics.pl, st.metrics.pl));
        playerMermaMap[name].top.push(deltaPct(pt.metrics.top_speed, st.metrics.top_speed));
        playerMermaMap[name].n++;
      }
    }

    const mermaPlayers = Object.entries(playerMermaMap)
      .map(([name, m]) => ({
        name,
        dist: avg(m.dist),
        m_min: avg(m.m_min),
        z5: avg(m.z5),
        pl: avg(m.pl),
        top: avg(m.top),
        n: m.n,
      }))
      .sort((a, b) => a.dist - b.dist);

    // --- BENCHMARKS ---
    const benchmarks = Object.entries(BENCHMARKS).map(([key, b]) => {
      const val = avg(allMatchAggs.map((m) => (m as any)[key]));
      return {
        key: key as MetricKey,
        label: b.label,
        value: val,
        amateur: b.amateur,
        professional: b.professional,
      };
    });

    const maxDistSession = sessionSummaries.reduce((a, b) => ((a.promTotal.dist || 0) > (b.promTotal.dist || 0) ? a : b), sessionSummaries[0]);
    const maxPLSession = sessionSummaries.reduce((a, b) => ((a.promTotal.pl || 0) > (b.promTotal.pl || 0) ? a : b), sessionSummaries[0]);
    const maxZ5Session = sessionSummaries.reduce((a, b) => ((a.promTotal.z5 || 0) > (b.promTotal.z5 || 0) ? a : b), sessionSummaries[0]);

    const insights = [
      {
        title: "Mejor rendimiento físico",
        text: `El partido ${maxDistSession?.name} marcó el pico de distancia recorrida con un promedio de ${maxDistSession?.promTotal.dist?.toFixed(0)} m por jugador. El máximo Player Load del ciclo se vio en ${maxPLSession?.name} (${maxPLSession?.promTotal.pl?.toFixed(0)}).`,
      },
      {
        title: "Volumen de sprints",
        text: `Los sprints (Z5 >25.2 km/h) más altos se dieron en ${maxZ5Session?.name} con ${maxZ5Session?.promTotal.z5?.toFixed(0)} metros promedio.`,
      },
      {
        title: "Merma física entre tiempos",
        text: `Considerando ambos tiempos, la distancia recorrida cae en promedio ${mermaMetrics[0]?.deltaPct.toFixed(1)}% entre el 1° y el 2° tiempo. La intensidad (m/min) cae ${mermaMetrics[1]?.deltaPct.toFixed(1)}% y los sprints Z5 caen ${mermaMetrics[2]?.deltaPct.toFixed(1)}%.`,
      },
    ];

    return NextResponse.json({
      kpis,
      sessions: sessionSummaries,
      rankings,
      athletes,
      merma: { metrics: mermaMetrics, mode: "completos", players: mermaPlayers },
      benchmarks,
      insights,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
