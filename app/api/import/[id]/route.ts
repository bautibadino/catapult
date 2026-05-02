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

    // 1. Delete GPS records for this import
    await GpsRecord.deleteMany({ sourceFileId: id });

    // 2. Delete import file
    await ImportFile.findByIdAndDelete(id);

    // 3. Bulk delete orphaned sessions (no GPS records reference them)
    const activeSessionIds = await GpsRecord.distinct("sessionId");
    await Session.deleteMany({
      _id: { $nin: activeSessionIds },
    });

    // 4. Bulk delete orphaned athletes (no GPS records reference them)
    const activeAthleteIds = await GpsRecord.distinct("athleteId");
    await Athlete.deleteMany({
      _id: { $nin: activeAthleteIds },
    });

    // 5. Update athlete counts for all remaining sessions using aggregation
    const sessionCounts = await GpsRecord.aggregate([
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
    ]);

    const bulkOps = sessionCounts.map((sc) => ({
      updateOne: {
        filter: { _id: sc._id },
        update: { $set: { athleteCount: sc.count } },
      },
    }));

    if (bulkOps.length > 0) {
      await Session.bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Delete import error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
