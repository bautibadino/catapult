import "dotenv/config";
import { connectDB } from "@/lib/mongodb";
import { ImportFile } from "@/models/import-file";
import { Athlete } from "@/models/athlete";
import { Session } from "@/models/session";
import { GpsRecord } from "@/models/gps-record";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function hashString(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 24);
}

async function main() {
  await connectDB();

  const dataPath = path.join(process.cwd(), "..", "data.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(raw);

  const fileHash = hashString(raw);
  const existing = await ImportFile.findOne({ fileHash }).lean();
  if (existing) {
    console.log("Sample data already imported.");
    process.exit(0);
  }

  const importFile = await ImportFile.create({
    fileName: "ADIUR_GPS_Primera.html (embedded)",
    displayName: "ADIUR GPS Primera — Seed inicial",
    fileHash,
    rowCount: 0,
    importedCount: 0,
    importErrors: [],
  });

  let importedCount = 0;
  const team = "ADIUR Primera";

  for (const partido of data.partidos) {
    const sessionName = `F${partido.fecha} vs ${partido.rival}`;
    const date = partido.dia;

    const session = await Session.findOneAndUpdate(
      { name: sessionName, date, team },
      { $setOnInsert: { name: sessionName, date, team, rival: partido.rival, athleteCount: 0 } },
      { upsert: true, new: true }
    );

    const halves: [string, Record<string, any>][] = [
      ["Full", partido.total],
      ["1st Half", partido.pt || {}],
      ["2nd Half", partido.st || {}],
    ];

    for (const [half, players] of halves) {
      for (const [playerName, stats] of Object.entries(players)) {
        const normalizedName = playerName.toUpperCase().trim();
        const athlete = await Athlete.findOneAndUpdate(
          { normalizedName, team },
          { $setOnInsert: { name: playerName, normalizedName, team } },
          { upsert: true, new: true }
        );

        const metrics = {
          dur: stats.dur || 0,
          dist: stats.dist || 0,
          m_min: stats.m_min || 0,
          z3: stats.z3 || 0,
          z4: stats.z4 || 0,
          z5: stats.z5 || 0,
          top_speed: stats.top_speed || 0,
          a23: stats.a23 || 0,
          a34: stats.a34 || 0,
          a4: stats.a4 || 0,
          d23: stats.d23 || 0,
          d34: stats.d34 || 0,
          d4: stats.d4 || 0,
          max_acc: stats.max_acc || 0,
          max_dec: stats.max_dec || 0,
          pl: stats.pl || 0,
        };

        const rowHash = hashString(`${fileHash}-${playerName}-${sessionName}-${date}-${half}`);
        const exists = await GpsRecord.findOne({ rowHash }).lean();
        if (exists) continue;

        await GpsRecord.create({
          athleteId: athlete._id,
          athleteName: athlete.name,
          sessionId: session._id,
          sessionName: session.name,
          sessionDate: session.date,
          team,
          half: half as any,
          metrics,
          rawRow: stats,
          sourceFileId: importFile._id,
          rowHash,
        });

        importedCount++;
      }
    }
  }

  await ImportFile.findByIdAndUpdate(importFile._id, { importedCount });

  const sessions = await Session.find();
  for (const s of sessions) {
    const count = await GpsRecord.countDocuments({ sessionId: s._id });
    await Session.findByIdAndUpdate(s._id, { athleteCount: count });
  }

  const athletes = await Athlete.find();
  for (const a of athletes) {
    const count = await GpsRecord.distinct("sessionId", { athleteId: a._id });
    await Athlete.findByIdAndUpdate(a._id, { sessionsCount: count.length });
  }

  console.log(`Seeded ${importedCount} records.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
