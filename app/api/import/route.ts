import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { parseCSV } from "@/lib/csv/parse-csv";
import { detectColumnMapping, getMappedValue, getPlayerName, getDurationFromTimes } from "@/lib/csv/normalize-columns";
import { parseNumeric } from "@/lib/csv/infer-schema";
import { ImportFile } from "@/models/import-file";
import { Athlete } from "@/models/athlete";
import { Session } from "@/models/session";
import { GpsRecord } from "@/models/gps-record";
import crypto from "crypto";
import mongoose from "mongoose";

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

    // --- BULK PREP ---
    const playerMap = new Map<string, { name: string; normalized: string; team: string; position?: string }>();
    const sessionMap = new Map<string, { name: string; date: string; team: string }>();
    const recordsToInsert: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawSessionName = getMappedValue(row, mapping, "session") || `Sesión importada`;
      const dateRaw = getMappedValue(row, mapping, "date") || new Date().toISOString().slice(0, 10);
      let playerName = getPlayerName(row, mapping);
      if (!playerName) {
        const firstCol = Object.keys(row)[0];
        const firstVal = row[firstCol];
        if (firstVal && firstVal.trim().length > 2 && isNaN(Number(firstVal.trim()))) {
          playerName = firstVal.trim();
        } else {
          playerName = `Jugador ${i + 1}`;
        }
      }
      const team = getMappedValue(row, mapping, "team") || "ADIUR Primera";
      const position = getMappedValue(row, mapping, "position") || undefined;
      
      // Detect half: explicit column first, then infer from session name / other fields
      let halfRaw = getMappedValue(row, mapping, "half");
      if (!halfRaw) {
        // Check session name for half indicators
        const sn = rawSessionName.toLowerCase();
        if (sn.includes("1st") || sn.includes("first") || sn.includes("primer")) halfRaw = "1st Half";
        else if (sn.includes("2nd") || sn.includes("second") || sn.includes("segundo")) halfRaw = "2nd Half";
      }
      if (!halfRaw) {
        // Scan all column values for half indicators
        for (const val of Object.values(row)) {
          const v = val?.toLowerCase() || "";
          if (v.includes("1st half") || v.includes("first half") || v.includes("primer tiempo")) {
            halfRaw = "1st Half";
            break;
          }
          if (v.includes("2nd half") || v.includes("second half") || v.includes("segundo tiempo")) {
            halfRaw = "2nd Half";
            break;
          }
        }
      }
      const half = ["1st Half", "2nd Half", "Full"].includes(halfRaw || "")
        ? (halfRaw as "1st Half" | "2nd Half" | "Full")
        : "Full";

      // Clean session name so both halves share the same session
      let sessionName = rawSessionName
        .replace(/1st\s+half|first\s+half|primer\s+tiempo/gi, "")
        .replace(/2nd\s+half|second\s+half|segundo\s+tiempo/gi, "")
        .replace(/[\s\-_]+$/, "")
        .trim();
      if (!sessionName) sessionName = "Sesión importada";

      const normalizedPlayerName = playerName.toUpperCase().trim();
      const playerKey = `${normalizedPlayerName}||${team}`;
      const sessionKey = `${sessionName}||${dateRaw}||${team}`;

      if (!playerMap.has(playerKey)) {
        playerMap.set(playerKey, { name: playerName, normalized: normalizedPlayerName, team, position });
      }
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, { name: sessionName, date: dateRaw, team });
      }

      const durVal = parseNumeric(getMappedValue(row, mapping, "duration"));
      const duration = durVal > 0 ? durVal : getDurationFromTimes(row, mapping);

      const metrics = {
        dur: duration,
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

      recordsToInsert.push({
        athleteKey: playerKey,
        sessionKey,
        half,
        metrics,
        rawRow: row,
        rowHash,
        team,
        position,
        athleteName: playerName,
        sessionName,
        sessionDate: dateRaw,
      });
    }

    // --- BULK INSERT ATHLETES ---
    const athleteDocs = Array.from(playerMap.values()).map((p) => ({
      name: p.name,
      normalizedName: p.normalized,
      team: p.team,
      position: p.position,
      sessionsCount: 0,
    }));

    try {
      await Athlete.insertMany(athleteDocs, { ordered: false });
    } catch {
      // Ignore duplicate key errors
    }

    // --- BULK INSERT SESSIONS ---
    const sessionDocs = Array.from(sessionMap.values()).map((s) => ({
      name: s.name,
      date: s.date,
      team: s.team,
      athleteCount: 0,
    }));

    try {
      await Session.insertMany(sessionDocs, { ordered: false });
    } catch {
      // Ignore duplicate key errors
    }

    // --- LOAD ALL IN MEMORY ---
    const allAthletes = await Athlete.find({
      $or: Array.from(playerMap.keys()).map((k) => {
        const [name, team] = k.split("||");
        return { normalizedName: name, team };
      }),
    }).lean();

    const allSessions = await Session.find({
      $or: Array.from(sessionMap.keys()).map((k) => {
        const [name, date, team] = k.split("||");
        return { name, date, team };
      }),
    }).lean();

    const athleteIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const a of allAthletes) {
      athleteIdMap.set(`${a.normalizedName}||${a.team}`, a._id as mongoose.Types.ObjectId);
    }

    const sessionIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const s of allSessions) {
      sessionIdMap.set(`${s.name}||${s.date}||${s.team}`, s._id as mongoose.Types.ObjectId);
    }

    // --- CHECK DUPLICATES IN BATCH ---
    const rowHashes = recordsToInsert.map((r) => r.rowHash);
    const existingHashes = new Set(
      (await GpsRecord.find({ rowHash: { $in: rowHashes } }).select("rowHash").lean()).map(
        (r) => r.rowHash
      )
    );

    // --- BULK INSERT GPS RECORDS ---
    const gpsDocs = recordsToInsert
      .filter((r) => !existingHashes.has(r.rowHash))
      .map((r) => ({
        athleteId: athleteIdMap.get(r.athleteKey),
        athleteName: r.athleteName,
        sessionId: sessionIdMap.get(r.sessionKey),
        sessionName: r.sessionName,
        sessionDate: r.sessionDate,
        team: r.team,
        position: r.position,
        half: r.half,
        metrics: r.metrics,
        rawRow: r.rawRow,
        sourceFileId: importFile._id,
        rowHash: r.rowHash,
      }))
      .filter((r) => r.athleteId && r.sessionId);

    let importedCount = 0;
    if (gpsDocs.length > 0) {
      const result = await GpsRecord.insertMany(gpsDocs, { ordered: false });
      importedCount = result.length;
    }

    await ImportFile.findByIdAndUpdate(importFile._id, {
      importedCount,
      importErrors: errors,
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
    console.error("Import error:", err);
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

    // Fast cleanup: update counts only for affected sessions/athletes
    const allSessionIds = await GpsRecord.distinct("sessionId");
    await Session.updateMany(
      {},
      [{ $set: { athleteCount: { $size: { $ifNull: ["$athletes", []] } } } }]
    );

    // Count per session using aggregation
    const sessionCounts = await GpsRecord.aggregate([
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
    ]);
    for (const sc of sessionCounts) {
      await Session.findByIdAndUpdate(sc._id, { athleteCount: sc.count });
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
