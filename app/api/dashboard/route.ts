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

    const fullRecords = allRecords.filter((r) => r.half === "Full" || !r.half);
    const ptRecords = allRecords.filter((r) => r.half === "1st Half");
    const stRecords = allRecords.filter((r) => r.half === "2nd Half");

    const distAvg = avg(getMetricsArray(fullRecords, "dist"));
    const mminAvg = avg(getMetricsArray(fullRecords, "m_min"));
    const z5Avg = avg(getMetricsArray(fullRecords, "z5"));
    const topAvg = avg(getMetricsArray(fullRecords, "top_speed"));
    const plAvg = avg(getMetricsArray(fullRecords, "pl"));
    const athleteNames = Array.from(new Set(fullRecords.map((r) => r.athleteName)));

    const kpis = [
      { label: "Distancia / partido", value: distAvg / 1000, unit: "km", sub: `${mminAvg.toFixed(1)} m/min · promedio`, highlight: true },
      { label: "Sprints Z5", value: z5Avg, unit: "m", sub: "distancia >25.2 km/h por partido" },
      { label: "Top Speed promedio", value: topAvg, unit: "km/h", sub: "velocidad máxima del equipo" },
      { label: "Player Load", value: plAvg, unit: "", sub: "carga mecánica promedio" },
      { label: "Plantel", value: athleteNames.length, unit: "", sub: "jugadores con datos" },
    ];

    const sessionSummaries = sessions.map((s) => {
      const sRecords = fullRecords.filter((r) => String(r.sessionId) === String(s._id));
      return {
        _id: String(s._id),
        name: s.name,
        date: s.date,
        rival: s.rival,
        athleteCount: s.athleteCount,
        promTotal: {
          dist: avg(getMetricsArray(sRecords, "dist")),
          m_min: avg(getMetricsArray(sRecords, "m_min")),
          z5: avg(getMetricsArray(sRecords, "z5")),
          top_speed: avg(getMetricsArray(sRecords, "top_speed")),
          a4: avg(getMetricsArray(sRecords, "a4")),
          d4: avg(getMetricsArray(sRecords, "d4")),
          pl: avg(getMetricsArray(sRecords, "pl")),
        },
      };
    });

    const athleteMap: Record<string, any[]> = {};
    for (const r of fullRecords) {
      if (!athleteMap[r.athleteName]) athleteMap[r.athleteName] = [];
      athleteMap[r.athleteName].push(r);
    }

    const athletes = Object.entries(athleteMap).map(([name, records]) => ({
      _id: String(records[0].athleteId),
      name,
      pj: records.length,
      dur: sum(records.map((r) => r.metrics.dur)),
      dist: avg(records.map((r) => r.metrics.dist)),
      m_min: avg(records.map((r) => r.metrics.m_min)),
      z5: avg(records.map((r) => r.metrics.z5)),
      top: Math.max(...records.map((r) => r.metrics.top_speed)),
      a4: avg(records.map((r) => r.metrics.a4)),
      d4: avg(records.map((r) => r.metrics.d4)),
      pl: avg(records.map((r) => r.metrics.pl)),
    }));

    function makeRanking(key: MetricKey) {
      const sorted = [...athletes].sort((a, b) => (b as any)[key === "dist" ? "dist" : key === "z5" ? "z5" : "pl"] - (a as any)[key === "dist" ? "dist" : key === "z5" ? "z5" : "pl"]);
      const maxV = sorted[0] ? (sorted[0] as any)[key === "dist" ? "dist" : key === "z5" ? "z5" : "pl"] : 1;
      return sorted.slice(0, 8).map((a, i) => ({
        rank: i + 1,
        name: a.name,
        value: (a as any)[key === "dist" ? "dist" : key === "z5" ? "z5" : "pl"],
        pj: a.pj,
        max: maxV,
      }));
    }

    const rankings = {
      dist: makeRanking("dist"),
      z5: makeRanking("z5"),
      pl: makeRanking("pl"),
    };

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

    const benchmarks = Object.entries(BENCHMARKS).map(([key, b]) => {
      const val = avg(getMetricsArray(fullRecords, key as MetricKey));
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
