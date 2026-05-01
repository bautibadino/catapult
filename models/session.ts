import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  name: string;
  date: string;
  rival?: string;
  team: string;
  athleteCount: number;
  metricsSummary?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    name: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    rival: { type: String },
    team: { type: String, required: true },
    athleteCount: { type: Number, default: 0 },
    metricsSummary: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SessionSchema.index({ name: 1, date: 1, team: 1 }, { unique: true });

export const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
