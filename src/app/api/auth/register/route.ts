import { ApiError, handle, json, readJson } from '@/lib/api';
import { hashPassword } from '@/lib/auth/password';
import { clientIp, rateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { User } from '@/lib/models/User';
import { registerSchema } from '@/lib/validation';

export const POST = handle(async (req) => {
  const limit = rateLimit(`register:${clientIp(req)}`, 10, 15 * 60_000);
  if (!limit.ok) throw new ApiError(429, 'Too many attempts. Please wait a few minutes and try again.', { 'Retry-After': String(limit.retryAfter) });

  const { name, email, password } = await readJson(req, registerSchema);
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists. Try signing in instead.');

  const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
  await createSession(String(user._id), user.tokenVersion ?? 0);
  return json({ user: { id: String(user._id), name: user.name, email: user.email } }, { status: 201 });
});
