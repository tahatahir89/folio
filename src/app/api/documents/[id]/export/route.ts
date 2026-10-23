import { ApiError, contentDisposition, handle, objectId, requireUser } from '@/lib/api';
import { rateLimit } from '@/lib/auth/rate-limit';
import { sanitizeDoc } from '@/lib/doc-utils';
import { sanitizeFilename } from '@/lib/export/common';
import { exportDocx } from '@/lib/export/docx';
import { resolveImages } from '@/lib/export/images';
import { exportPdf } from '@/lib/export/pdf';
import { DocumentModel } from '@/lib/models/Document';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

export const GET = handle<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const format = new URL(req.url).searchParams.get('format');
  if (format !== 'pdf' && format !== 'docx') throw new ApiError(400, 'Choose an export format: pdf or docx.');

  const limit = rateLimit(`export:${user.id}`, 30, 60_000);
  if (!limit.ok) throw new ApiError(429, 'You are exporting too quickly. Wait a moment and try again.', { 'Retry-After': String(limit.retryAfter) });

  const doc = await DocumentModel.findOne({ _id: objectId(id), ownerId: user.id }).lean();
  if (!doc) throw new ApiError(404, 'Document not found.');

  let bytes: Buffer;
  try {
    const content = sanitizeDoc(doc.content);
    const images = await resolveImages(content);
    const options = { title: doc.title, settings: doc.settings, images };
    bytes = format === 'pdf' ? await exportPdf(content, options) : await exportDocx(content, options);
  } catch (err) {
    console.error(`[folio] ${format} export failed:`, err);
    throw new ApiError(500, `We couldn't generate the ${format.toUpperCase()} file. Try again, or try the other format.`);
  }

  const filename = `${sanitizeFilename(doc.title)}.${format}`;
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': TYPES[format],
      'Content-Disposition': contentDisposition(filename),
      'Content-Length': String(bytes.length),
      'Cache-Control': 'private, no-store',
    },
  });
});
