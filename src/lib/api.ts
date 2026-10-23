import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodType, type ZodTypeDef } from 'zod';
import mongoose from 'mongoose';
import { getCurrentUser } from './auth/session';
import { connectDb } from './db';
import { DocValidationError } from './doc-utils';
import type { PublicUser } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, 'Your session has expired. Please sign in again.');
  return user;
}

export async function readJson<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Invalid request.');
  return parsed.data;
}

export function objectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Document not found.');
  return new mongoose.Types.ObjectId(id);
}

type Handler<P> = (req: NextRequest, ctx: { params: Promise<P> }) => Promise<Response>;

/** Wraps a route handler with DB connection, same-origin check and uniform error responses. */
export function handle<P = Record<string, never>>(fn: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const origin = req.headers.get('origin');
        if (origin && new URL(origin).host !== req.headers.get('host')) {
          throw new ApiError(403, 'Cross-origin requests are not allowed.');
        }
      }
      await connectDb();
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status, headers: err.headers });
  }
  if (err instanceof DocValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
  if (err instanceof ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  const name = (err as { name?: string })?.name ?? '';
  const code = (err as { code?: number })?.code;
  if (code === 11000) return NextResponse.json({ error: 'That value is already in use.' }, { status: 409 });
  if (/MongooseServerSelection|MongoNetwork|MongoParseError/.test(name) || /MONGODB_URI|AUTH_SECRET/.test(String((err as Error)?.message))) {
    console.error('[folio] configuration or database error:', err);
    return NextResponse.json(
      { error: "Folio can't reach its database. Check MONGODB_URI in .env.local and that MongoDB is running." },
      { status: 503 },
    );
  }
  console.error('[folio] unexpected error:', err);
  return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 });
}

export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
