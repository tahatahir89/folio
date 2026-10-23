import { ApiError, handle, json, readJson, requireUser } from '@/lib/api';
import { verifyPassword } from '@/lib/auth/password';
import { destroySession } from '@/lib/auth/session';
import { DocumentModel } from '@/lib/models/Document';
import { User } from '@/lib/models/User';
import { deleteAccountSchema, profileSchema } from '@/lib/validation';

export const PATCH = handle(async (req) => {
  const user = await requireUser();
  const { name } = await readJson(req, profileSchema);
  await User.updateOne({ _id: user.id }, { $set: { name } });
  return json({ user: { ...user, name } });
});

export const DELETE = handle(async (req) => {
  const user = await requireUser();
  const { password } = await readJson(req, deleteAccountSchema);
  const record = await User.findById(user.id).select('+passwordHash');
  if (!record || !(await verifyPassword(password, record.passwordHash))) throw new ApiError(403, 'That password is not correct.');
  await DocumentModel.deleteMany({ ownerId: record._id });
  await User.deleteOne({ _id: record._id });
  await destroySession();
  return json({ ok: true });
});
