import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Session } from "@/models/session";
import { GpsRecord } from "@/models/gps-record";
import { avg } from "@/lib/metrics/aggregate";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await Session.findById(id).lean();
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const records = await GpsRecord.find({ sessionId: id }).lean();
    const fullRecords = records.filter((r) => r.half === "Full" || !r.half);

    const promTotal = {
      dist: avg(fullRecords.map((r) => r.metrics.dist)),
      m_min: avg(fullRecords.map((r) => r.metrics.m_min)),
      z5: avg(fullRecords.map((r) => r.metrics.z5)),
      top_speed: avg(fullRecords.map((r) => r.metrics.top_speed)),
      a4: avg(fullRecords.map((r) => r.metrics.a4)),
      d4: avg(fullRecords.map((r) => r.metrics.d4)),
      pl: avg(fullRecords.map((r) => r.metrics.pl)),
    };

    const athletes = fullRecords.map((r) => ({
      athleteId: String(r.athleteId),
      athleteName: r.athleteName,
      metrics: r.metrics,
    }));

    return NextResponse.json({ session, athletes, promTotal });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
