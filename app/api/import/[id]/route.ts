import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ImportFile } from "@/models/import-file";
import { GpsRecord } from "@/models/gps-record";
import { Session } from "@/models/session";
import { Athlete } from "@/models/athlete";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const importFile = await ImportFile.findById(id).lean();
    if (!importFile) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    await GpsRecord.deleteMany({ sourceFileId: id });
    await ImportFile.findByIdAndDelete(id);

    const orphanedSessions = await Session.find({
      _id: {
        $nin: await GpsRecord.distinct("sessionId"),
      },
    });
    for (const s of orphanedSessions) {
      await Session.findByIdAndDelete(s._id);
    }

    const orphanedAthletes = await Athlete.find({
      _id: {
        $nin: await GpsRecord.distinct("athleteId"),
      },
    });
    for (const a of orphanedAthletes) {
      await Athlete.findByIdAndDelete(a._id);
    }

    const remainingSessions = await Session.find();
    for (const s of remainingSessions) {
      const count = await GpsRecord.countDocuments({ sessionId: s._id });
      await Session.findByIdAndUpdate(s._id, { athleteCount: count });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Delete import error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
