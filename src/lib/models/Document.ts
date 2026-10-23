import mongoose, { Schema, type Model } from 'mongoose';
import type { DocSettings, PMNode } from '../types';

const SettingsSchema = new Schema(
  {
    pageSize: { type: String, enum: ['a4', 'letter'], default: 'a4' },
    margins: { type: String, enum: ['narrow', 'normal', 'wide'], default: 'normal' },
    pageNumbers: { type: Boolean, default: false },
  },
  { _id: false },
);

const DocumentSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Untitled document', trim: true, maxlength: 200 },
    /** Tiptap/ProseMirror JSON, so rich formatting survives round trips and exports. */
    content: { type: Schema.Types.Mixed, required: true },
    excerpt: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    template: { type: String, default: null },
    settings: { type: SettingsSchema, default: () => ({}) },
    starred: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    lastOpenedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, minimize: false },
);

DocumentSchema.index({ ownerId: 1, trashed: 1, updatedAt: -1 });
DocumentSchema.index({ ownerId: 1, trashed: 1, lastOpenedAt: -1 });

export interface DocumentRecord {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  title: string;
  content: PMNode;
  excerpt: string;
  wordCount: number;
  template: string | null;
  settings: DocSettings;
  starred: boolean;
  trashed: boolean;
  trashedAt: Date | null;
  lastOpenedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const DocumentModel: Model<DocumentRecord> =
  (mongoose.models.Document as Model<DocumentRecord> | undefined) ?? mongoose.model<DocumentRecord>('Document', DocumentSchema);
