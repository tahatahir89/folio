import { ApiError, handle, json, objectId, readJson, requireUser } from '@/lib/api';
import { sanitizeDoc, summarize } from '@/lib/doc-utils';
import { DocumentModel } from '@/lib/models/Document';
import { toFull } from '@/lib/serialize';
import { updateDocumentSchema } from '@/lib/validation';

type Params = { id: string };

export const GET = handle<Params>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const doc = await DocumentModel.findOneAndUpdate(
    { _id: objectId(id), ownerId: user.id },
    { $set: { lastOpenedAt: new Date() } },
    { new: true, timestamps: false },
  ).lean();
  if (!doc) throw new ApiError(404, 'Document not found.');
  return json({ document: toFull(doc) });
});

export const PATCH = handle<Params>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const body = await readJson(req, updateDocumentSchema);

  const set: Record<string, unknown> = {};
  let touchesContent = false;
  if (body.title !== undefined) {
    set.title = body.title;
    touchesContent = true;
  }
  if (body.content !== undefined) {
    const content = sanitizeDoc(body.content);
    Object.assign(set, { content, ...summarize(content) });
    touchesContent = true;
  }
  if (body.settings) {
    for (const [k, v] of Object.entries(body.settings)) if (v !== undefined) set[`settings.${k}`] = v;
    touchesContent = true;
  }
  if (body.starred !== undefined) set.starred = body.starred;
  if (body.trashed !== undefined) {
    set.trashed = body.trashed;
    set.trashedAt = body.trashed ? new Date() : null;
  }

  // Trashed documents are read-only until restored.
  const filter: Record<string, unknown> = { _id: objectId(id), ownerId: user.id };
  if (touchesContent) filter.trashed = false;

  const doc = await DocumentModel.findOneAndUpdate(filter, { $set: set }, { new: true, timestamps: touchesContent })
    .select('title updatedAt starred trashed')
    .lean();
  if (!doc) {
    const exists = await DocumentModel.exists({ _id: objectId(id), ownerId: user.id });
    throw new ApiError(exists ? 409 : 404, exists ? 'This document is in the trash. Restore it to edit.' : 'Document not found.');
  }
  return json({ id, title: doc.title, updatedAt: doc.updatedAt.toISOString(), starred: doc.starred, trashed: doc.trashed });
});

export const DELETE = handle<Params>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const deleted = await DocumentModel.findOneAndDelete({ _id: objectId(id), ownerId: user.id, trashed: true });
  if (!deleted) {
    const exists = await DocumentModel.exists({ _id: objectId(id), ownerId: user.id });
    throw new ApiError(exists ? 409 : 404, exists ? 'Move the document to the trash before deleting it permanently.' : 'Document not found.');
  }
  return json({ ok: true });
});
