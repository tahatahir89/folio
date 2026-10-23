import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { EditorShell } from '@/components/editor/EditorShell';
import { getCurrentUser } from '@/lib/auth/session';
import { connectDb } from '@/lib/db';
import { DocumentModel } from '@/lib/models/Document';
import { toFull } from '@/lib/serialize';

export const metadata: Metadata = { title: 'Editor', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectDb();
  // Ownership is enforced in the query itself: someone else's document id simply does not exist for this user.
  const doc = await DocumentModel.findOneAndUpdate(
    { _id: id, ownerId: user.id },
    { $set: { lastOpenedAt: new Date() } },
    { new: true, timestamps: false },
  ).lean();
  if (!doc) notFound();

  return <EditorShell doc={JSON.parse(JSON.stringify(toFull(doc)))} user={user} />;
}
