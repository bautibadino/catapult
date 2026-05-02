import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Athlete } from "@/models/athlete";
import { GpsRecord } from "@/models/gps-record";
import { avg, max, sum } from "@/lib/metrics/aggregate";

function aggregateMatch(records: any[]) {
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
  const m_min = dur > 0 ? dist / dur : 0;

  return { dur, dist, m_min, z3, z4, z5, top_speed, a23, a34, a4, d23, d34, d4, max_acc, max_dec, pl };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const athlete = await Athlete.findById(id).lean();
    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    const records = await GpsRecord.find({ athleteId: id }).sort({ sessionDate: -1 }).lean();

    // Group by session
    const sessionMap: Record<string, any[]> = {};
    for (const r of records) {
      const sid = String(r.sessionId);
      if (!sessionMap[sid]) sessionMap[sid] = [];
      sessionMap[sid].push(r);
    }

    const sessions = Object.entries(sessionMap).map(([sessionId, recs]) => ({
      sessionId,
      sessionName: recs[0].sessionName,
      sessionDate: recs[0].sessionDate,
      half: recs.length > 1 ? "Full" : recs[0].half,
      metrics: aggregateMatch(recs),
    }));

    const summary = {
      pj: sessions.length,
      totalDur: sum(sessions.map((s) => s.metrics.dur)),
      avgDist: avg(sessions.map((s) => s.metrics.dist)),
      avgMmin: avg(sessions.map((s) => s.metrics.m_min)),
      avgZ5: avg(sessions.map((s) => s.metrics.z5)),
      maxSpeed: Math.max(...sessions.map((s) => s.metrics.top_speed)),
      avgA4: avg(sessions.map((s) => s.metrics.a4)),
      avgD4: avg(sessions.map((s) => s.metrics.d4)),
      avgPL: avg(sessions.map((s) => s.metrics.pl)),
    };

    return NextResponse.json({ athlete, sessions, summary });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
