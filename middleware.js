// middleware.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987'

export function middleware(request) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  const protectedRoutes = ['/account', '/checkout', '/orders']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtected) return NextResponse.next()

  if (!token) return NextResponse.redirect(new URL('/login', request.url))

  try {
    jwt.verify(token, secret)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('token')
    return res
  }
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*', '/orders/:path*']
}
