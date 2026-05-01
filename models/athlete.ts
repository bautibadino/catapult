import mongoose, { Schema, Document } from "mongoose";

export interface IAthlete extends Document {
  name: string;
  normalizedName: string;
  team?: string;
  position?: string;
  sessionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AthleteSchema = new Schema<IAthlete>(
  {
    name: { type: String, required: true, index: true },
    normalizedName: { type: String, required: true, index: true },
    team: { type: String },
    position: { type: String },
    sessionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AthleteSchema.index({ normalizedName: 1, team: 1 }, { unique: true });

export const Athlete =
  mongoose.models.Athlete || mongoose.model<IAthlete>("Athlete", AthleteSchema);
