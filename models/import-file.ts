import mongoose, { Schema, Document } from "mongoose";

export interface IImportFile extends Document {
  fileName: string;
  displayName: string;
  fileHash: string;
  rowCount: number;
  importedCount: number;
  importErrors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ImportFileSchema = new Schema<IImportFile>(
  {
    fileName: { type: String, required: true },
    displayName: { type: String, required: true },
    fileHash: { type: String, required: true, index: true },
    rowCount: { type: Number, default: 0 },
    importedCount: { type: Number, default: 0 },
    importErrors: [{ type: String }],
  },
  { timestamps: true }
);

export const ImportFile =
  mongoose.models.ImportFile || mongoose.model<IImportFile>("ImportFile", ImportFileSchema);
