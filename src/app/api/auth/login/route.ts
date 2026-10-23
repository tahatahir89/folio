import { ApiError, handle, json, readJson } from '@/lib/api';
import { burnPasswordCheck, verifyPassword } from '@/lib/auth/password';
import { clientIp, rateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { User } from '@/lib/models/User';
import { loginSchema } from '@/lib/validation';

export const POST = handle(async (req) => {
  const { email, password } = await readJson(req, loginSchema);
  const limit = rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60_000);
  if (!limit.ok) throw new ApiError(429, 'Too many sign-in attempts. Please wait a few minutes and try again.', { 'Retry-After': String(limit.retryAfter) });

  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = user ? await verifyPassword(password, user.passwordHash) : await burnPasswordCheck(password);
  if (!user || !valid) throw new ApiError(401, 'Incorrect email or password.');

  await createSession(String(user._id), user.tokenVersion ?? 0);
  return json({ user: { id: String(user._id), name: user.name, email: user.email } });
});
