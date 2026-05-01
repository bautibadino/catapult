import mongoose, { Schema, Document } from "mongoose";
import { GpsMetrics } from "@/types/gps";

export interface IGpsRecord extends Document {
  athleteId: mongoose.Types.ObjectId;
  athleteName: string;
  sessionId: mongoose.Types.ObjectId;
  sessionName: string;
  sessionDate: string;
  team?: string;
  position?: string;
  half?: "Full" | "1st Half" | "2nd Half";
  metrics: GpsMetrics;
  rawRow: Record<string, unknown>;
  sourceFileId: mongoose.Types.ObjectId;
  rowHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const MetricsSchema = new Schema<GpsMetrics>(
  {
    dur: { type: Number, default: 0 },
    dist: { type: Number, default: 0 },
    m_min: { type: Number, default: 0 },
    z3: { type: Number, default: 0 },
    z4: { type: Number, default: 0 },
    z5: { type: Number, default: 0 },
    top_speed: { type: Number, default: 0 },
    a23: { type: Number, default: 0 },
    a34: { type: Number, default: 0 },
    a4: { type: Number, default: 0 },
    d23: { type: Number, default: 0 },
    d34: { type: Number, default: 0 },
    d4: { type: Number, default: 0 },
    max_acc: { type: Number, default: 0 },
    max_dec: { type: Number, default: 0 },
    pl: { type: Number, default: 0 },
  },
  { _id: false }
);

const GpsRecordSchema = new Schema<IGpsRecord>(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true, index: true },
    athleteName: { type: String, required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    sessionName: { type: String, required: true, index: true },
    sessionDate: { type: String, required: true, index: true },
    team: { type: String },
    position: { type: String },
    half: { type: String, enum: ["Full", "1st Half", "2nd Half"] },
    metrics: { type: MetricsSchema, required: true },
    rawRow: { type: Schema.Types.Mixed, default: {} },
    sourceFileId: { type: Schema.Types.ObjectId, ref: "ImportFile", required: true },
    rowHash: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

GpsRecordSchema.index({ athleteId: 1, sessionId: 1, half: 1 }, { unique: true });

export const GpsRecord =
  mongoose.models.GpsRecord || mongoose.model<IGpsRecord>("GpsRecord", GpsRecordSchema);
