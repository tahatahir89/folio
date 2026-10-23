import { ApiError, handle, json, readJson, requireUser } from '@/lib/api';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { User } from '@/lib/models/User';
import { changePasswordSchema } from '@/lib/validation';

export const POST = handle(async (req) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = await readJson(req, changePasswordSchema);
  const record = await User.findById(user.id).select('+passwordHash');
  if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) {
    throw new ApiError(403, 'Your current password is not correct.');
  }
  record.passwordHash = await hashPassword(newPassword);
  record.tokenVersion = (record.tokenVersion ?? 0) + 1; // signs out every other session
  await record.save();
  await createSession(String(record._id), record.tokenVersion);
  return json({ ok: true });
});
