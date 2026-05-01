import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Athlete } from "@/models/athlete";
import { GpsRecord } from "@/models/gps-record";
import { avg, max } from "@/lib/metrics/aggregate";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const athlete = await Athlete.findById(id).lean();
    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    const records = await GpsRecord.find({ athleteId: id }).sort({ sessionDate: -1 }).lean();
    const sessions = records.map((r) => ({
      sessionId: String(r.sessionId),
      sessionName: r.sessionName,
      sessionDate: r.sessionDate,
      half: r.half,
      metrics: r.metrics,
    }));

    const fullRecords = records.filter((r) => r.half === "Full" || !r.half);
    const summary = {
      pj: fullRecords.length,
      totalDur: fullRecords.reduce((s, r) => s + r.metrics.dur, 0),
      avgDist: avg(fullRecords.map((r) => r.metrics.dist)),
      avgMmin: avg(fullRecords.map((r) => r.metrics.m_min)),
      avgZ5: avg(fullRecords.map((r) => r.metrics.z5)),
      maxSpeed: max(fullRecords.map((r) => r.metrics.top_speed)),
      avgA4: avg(fullRecords.map((r) => r.metrics.a4)),
      avgD4: avg(fullRecords.map((r) => r.metrics.d4)),
      avgPL: avg(fullRecords.map((r) => r.metrics.pl)),
    };

    return NextResponse.json({ athlete, sessions, summary });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
