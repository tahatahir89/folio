import type { FilterQuery } from 'mongoose';
import { ApiError, handle, json, readJson, requireUser } from '@/lib/api';
import { summarize } from '@/lib/doc-utils';
import { DEFAULT_SETTINGS } from '@/lib/export/common';
import { DocumentModel, type DocumentRecord } from '@/lib/models/Document';
import { toSummary } from '@/lib/serialize';
import { getTemplate } from '@/lib/templates/data';
import { createDocumentSchema, listQuerySchema } from '@/lib/validation';
import { escapeRegex } from '@/lib/utils';
import mongoose from 'mongoose';

export const GET = handle(async (req) => {
  const user = await requireUser();
  const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) throw new ApiError(400, 'Invalid query.');
  const { view, q, sort, order } = parsed.data;

  const filter: FilterQuery<DocumentRecord> = { ownerId: new mongoose.Types.ObjectId(user.id), trashed: view === 'trash' };
  if (view === 'starred') filter.starred = true;
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

  const dir = order === 'asc' ? 1 : -1;
  let query = DocumentModel.find(filter).select('-content -settings');
  if (sort === 'title') query = query.sort({ title: order === 'desc' ? -1 : 1 }).collation({ locale: 'en', strength: 2 });
  else if (sort === 'created') query = query.sort({ createdAt: dir });
  else if (sort === 'modified') query = query.sort({ updatedAt: dir });
  else if (view === 'recent') query = query.sort({ lastOpenedAt: -1 }).limit(24);
  else query = query.sort({ updatedAt: -1 });

  const docs = await query.lean();
  return json({ documents: docs.map(toSummary) });
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const body = await readJson(req, createDocumentSchema);
  const template = getTemplate(body.templateId ?? 'blank');
  if (!template) throw new ApiError(400, 'That template does not exist.');

  const { excerpt, wordCount } = summarize(template.content);
  const created = await DocumentModel.create({
    ownerId: user.id,
    title: body.title ?? template.title,
    content: template.content,
    excerpt,
    wordCount,
    template: template.id === 'blank' ? null : template.id,
    settings: { ...DEFAULT_SETTINGS, ...template.settings },
  });
  return json({ document: toSummary(created.toObject()) }, { status: 201 });
});

/** Empties the trash: permanently deletes every trashed document owned by the user. */
export const DELETE = handle(async () => {
  const user = await requireUser();
  const res = await DocumentModel.deleteMany({ ownerId: user.id, trashed: true });
  return json({ deleted: res.deletedCount ?? 0 });
});
