export function mongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Run `npm run setup`, then check .env.local.');
  return uri;
}

export function authSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set to at least 32 characters. Run `npm run setup` to generate one.');
  }
  return new TextEncoder().encode(secret);
}
