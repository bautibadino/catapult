import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { parseCSV } from "@/lib/csv/parse-csv";
import { detectColumnMapping, getMappedValue } from "@/lib/csv/normalize-columns";
import { parseNumeric } from "@/lib/csv/infer-schema";
import { ImportFile } from "@/models/import-file";
import { Athlete } from "@/models/athlete";
import { Session } from "@/models/session";
import { GpsRecord } from "@/models/gps-record";
import crypto from "crypto";

function hashString(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 24);
}

interface ImportFileData {
  fileName: string;
  fileContent: string;
  displayName?: string;
}

async function processSingleFile(data: ImportFileData): Promise<{
  success: boolean;
  importId?: string;
  fileName: string;
  displayName: string;
  rowCount: number;
  importedCount: number;
  warning?: string;
  error?: string;
}> {
  const { fileName, fileContent, displayName } = data;

  try {
    const fileHash = hashString(fileContent);
    const existingImport = await ImportFile.findOne({ fileHash }).lean();
    if (existingImport) {
      return {
        success: false,
        fileName,
        displayName: displayName || fileName,
        rowCount: 0,
        importedCount: 0,
        warning: "File already imported",
      };
    }

    const { data: rows, errors: parseErrors } = parseCSV(fileContent);

    if (rows.length === 0) {
      return {
        success: false,
        fileName,
        displayName: displayName || fileName,
        rowCount: 0,
        importedCount: 0,
        error: "No rows found in CSV",
      };
    }

    const columns = Object.keys(rows[0]);
    const mapping = detectColumnMapping(columns);
    const unmapped = mapping.filter(
      (m) =>
        !m.mappedTo &&
        !["date", "session", "player", "team", "position", "half"].some((k) =>
          m.normalized.includes(k)
        )
    );

    const errors: string[] = parseErrors.map((e) => e.message);
    if (unmapped.length > 0) {
      errors.push(`Unmapped columns: ${unmapped.map((u) => u.raw).join(", ")}`);
    }

    const importFile = await ImportFile.create({
      fileName,
      displayName: displayName || fileName,
      fileHash,
      rowCount: rows.length,
      importedCount: 0,
      importErrors: errors,
    });

    let importedCount = 0;
    const rowErrors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const sessionName = getMappedValue(row, mapping, "session") || `Sesión ${i}`;
        const dateRaw = getMappedValue(row, mapping, "date") || new Date().toISOString().slice(0, 10);
        const playerName = getMappedValue(row, mapping, "player") || `Jugador ${i}`;
        const team = getMappedValue(row, mapping, "team") || "Sin equipo";
        const position = getMappedValue(row, mapping, "position") || undefined;
        const halfRaw = getMappedValue(row, mapping, "half") || "Full";
        const half = ["1st Half", "2nd Half", "Full"].includes(halfRaw)
          ? (halfRaw as "1st Half" | "2nd Half" | "Full")
          : "Full";

        const normalizedPlayerName = playerName.toUpperCase().trim();
        const athlete = await Athlete.findOneAndUpdate(
          { normalizedName: normalizedPlayerName, team },
          { $setOnInsert: { name: playerName, normalizedName: normalizedPlayerName, team, position } },
          { upsert: true, new: true }
        );

        const session = await Session.findOneAndUpdate(
          { name: sessionName, date: dateRaw, team },
          { $setOnInsert: { name: sessionName, date: dateRaw, team, rival: undefined, athleteCount: 0 } },
          { upsert: true, new: true }
        );

        const metrics = {
          dur: parseNumeric(getMappedValue(row, mapping, "duration")),
          dist: parseNumeric(getMappedValue(row, mapping, "dist")),
          m_min: parseNumeric(getMappedValue(row, mapping, "m_min")),
          z3: parseNumeric(getMappedValue(row, mapping, "z3")),
          z4: parseNumeric(getMappedValue(row, mapping, "z4")),
          z5: parseNumeric(getMappedValue(row, mapping, "z5")),
          top_speed: parseNumeric(getMappedValue(row, mapping, "top_speed")),
          a23: parseNumeric(getMappedValue(row, mapping, "a23")),
          a34: parseNumeric(getMappedValue(row, mapping, "a34")),
          a4: parseNumeric(getMappedValue(row, mapping, "a4")),
          d23: parseNumeric(getMappedValue(row, mapping, "d23")),
          d34: parseNumeric(getMappedValue(row, mapping, "d34")),
          d4: parseNumeric(getMappedValue(row, mapping, "d4")),
          max_acc: parseNumeric(getMappedValue(row, mapping, "max_acc")),
          max_dec: parseNumeric(getMappedValue(row, mapping, "max_dec")),
          pl: parseNumeric(getMappedValue(row, mapping, "pl")),
        };

        const rowHash = hashString(`${fileHash}-${i}-${playerName}-${sessionName}-${dateRaw}-${half}`);

        const existingRecord = await GpsRecord.findOne({ rowHash }).lean();
        if (existingRecord) continue;

        await GpsRecord.create({
          athleteId: athlete._id,
          athleteName: athlete.name,
          sessionId: session._id,
          sessionName: session.name,
          sessionDate: session.date,
          team: athlete.team,
          position: athlete.position,
          half,
          metrics,
          rawRow: row,
          sourceFileId: importFile._id,
          rowHash,
        });

        importedCount++;
      } catch (err) {
        rowErrors.push(`Row ${i + 1}: ${(err as Error).message}`);
      }
    }

    await ImportFile.findByIdAndUpdate(importFile._id, {
      importedCount,
      importErrors: [...errors, ...rowErrors],
    });

    return {
      success: true,
      importId: String(importFile._id),
      fileName,
      displayName: displayName || fileName,
      rowCount: rows.length,
      importedCount,
    };
  } catch (err) {
    return {
      success: false,
      fileName,
      displayName: displayName || fileName,
      rowCount: 0,
      importedCount: 0,
      error: (err as Error).message,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const files: ImportFileData[] = body.files || (body.fileName ? [body] : []);

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = await Promise.all(files.map((f) => processSingleFile(f)));

    const totalImported = results.reduce((s, r) => s + r.importedCount, 0);

    await Athlete.updateMany(
      {},
      [{ $set: { sessionsCount: { $size: { $ifNull: ["$sessions", []] } } } }]
    );

    const uniqueSessions = await GpsRecord.distinct("sessionId");
    for (const sessionId of uniqueSessions) {
      const count = await GpsRecord.countDocuments({ sessionId });
      await Session.findByIdAndUpdate(sessionId, { athleteCount: count });
    }

    return NextResponse.json({
      results,
      totalImported,
      totalFiles: files.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const imports = await ImportFile.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ imports });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
