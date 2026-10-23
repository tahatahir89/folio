import { cache } from 'react';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { authSecret } from '../env';
import { connectDb } from '../db';
import { User } from '../models/User';
import type { PublicUser } from '../types';

export const SESSION_COOKIE = 'folio_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function createSession(userId: string, tokenVersion: number) {
  const token = await new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(authSecret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (!payload.sub) return null;
    await connectDb();
    const user = await User.findById(payload.sub).lean();
    if (!user || (user.tokenVersion ?? 0) !== (payload.tv ?? 0)) return null;
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      plan: 'free',
      createdAt: user.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
});
