import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'folio_session';

async function isSignedIn(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

/** Fast redirect layer. Real authorization is enforced again on the server (layouts and API routes). */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = await isSignedIn(req);
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!signedIn && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (signedIn && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*', '/login', '/register'],
};
