import { NextResponse } from 'next/server';
import { verifyAppToken } from '@/lib/auth';

const PROTECTED_PATHS = ['/orders', '/checkout'];
const AUTH_PATHS = ['/login', '/signup'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  
  let user = null;
  if (token) {
    user = await verifyAppToken(token);
  }

  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/orders', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
