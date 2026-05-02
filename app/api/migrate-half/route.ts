import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GpsRecord } from "@/models/gps-record";
import { Session } from "@/models/session";

export async function POST() {
  try {
    await connectDB();
    const records = await GpsRecord.find({ $or: [{ half: "Full" }, { half: { $exists: false } }] }).lean();
    let updated = 0;
    const sessionUpdates = new Map<string, string>();

    for (const r of records) {
      const sn = (r.sessionName || "").toLowerCase();
      let half: "1st Half" | "2nd Half" | "Full" = "Full";
      
      if (sn.includes("1st") || sn.includes("first") || sn.includes("primer")) {
        half = "1st Half";
      } else if (sn.includes("2nd") || sn.includes("second") || sn.includes("segundo")) {
        half = "2nd Half";
      }

      if (half !== "Full") {
        // Clean session name
        let cleanName = (r.sessionName || "")
          .replace(/1st\s+half|first\s+half|primer\s+tiempo/gi, "")
          .replace(/2nd\s+half|second\s+half|segundo\s+tiempo/gi, "")
          .replace(/[\s\-_]+$/, "")
          .trim();
        if (!cleanName) cleanName = "Sesión importada";

        await GpsRecord.findByIdAndUpdate(r._id, { half, sessionName: cleanName });
        sessionUpdates.set(String(r.sessionId), cleanName);
        updated++;
      }
    }

    // Merge sessions: update session names and deduplicate
    for (const [sessionId, cleanName] of sessionUpdates) {
      const session = await Session.findById(sessionId);
      if (session) {
        // Check if a session with this clean name already exists
        const existing = await Session.findOne({
          name: cleanName,
          date: session.date,
          team: session.team,
          _id: { $ne: sessionId },
        });
        if (existing) {
          // Move all records to existing session and delete duplicate
          await GpsRecord.updateMany({ sessionId }, { sessionId: existing._id, sessionName: cleanName });
          await Session.findByIdAndDelete(sessionId);
        } else {
          await Session.findByIdAndUpdate(sessionId, { name: cleanName });
        }
      }
    }

    return NextResponse.json({ success: true, updated, message: `Updated ${updated} records with half detection` });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
