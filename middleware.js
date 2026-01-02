import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. القائمة البيضاء (الصفحات التي تحتاج تسجيل دخول)
  const protectedPaths = ['/account', '/orders', '/checkout'];

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    // إذا حاول يدخل صفحة محمية وهو ما عنده توكن، يرجع للوجن
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// تحديد المسارات التي يشتغل عليها الميدلوير لتقليل الضغط
export const config = {
  matcher: ['/account/:path*', '/orders/:path*', '/checkout/:path*'],
};