import { ApiError, handle, json, objectId, requireUser } from '@/lib/api';
import { DocumentModel } from '@/lib/models/Document';
import { toSummary } from '@/lib/serialize';

export const POST = handle<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const source = await DocumentModel.findOne({ _id: objectId(id), ownerId: user.id }).lean();
  if (!source) throw new ApiError(404, 'Document not found.');
  const copy = await DocumentModel.create({
    ownerId: user.id,
    title: `${source.title}`.slice(0, 190) + ' (copy)',
    content: source.content,
    excerpt: source.excerpt,
    wordCount: source.wordCount,
    template: source.template,
    settings: source.settings,
  });
  return json({ document: toSummary(copy.toObject()) }, { status: 201 });
});
