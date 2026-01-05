// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  const protectedRoutes = ['/account', '/checkout', '/orders']
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (!isProtected) return NextResponse.next()

  // ✅ فقط تحقق من الوجود
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*', '/orders/:path*']
}
