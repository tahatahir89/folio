import mongoose from 'mongoose';
import { mongoUri } from './env';

interface Cache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const g = globalThis as unknown as { __folioMongoose?: Cache };
const cache: Cache = g.__folioMongoose ?? (g.__folioMongoose = { conn: null, promise: null });

/** Reuses one connection across hot reloads and serverless invocations. */
export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri(), { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
