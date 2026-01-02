import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import woocommerceApi from '@/lib/woocommerce'

const secret = process.env.JWT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    // التحقق من WordPress
    const wpRes = await fetch('https://furssati.io/wp-json/jwt-auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!wpRes.ok) {
      return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 401 })
    }

    const data = await wpRes.json()
    if (!data.token) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 401 })

    // جلب customer_id من WooCommerce
    let customerId = null
    try {
      const customerRes = await woocommerceApi.get('customers', { email: data.user_email })
      if (customerRes.data?.length) customerId = customerRes.data[0].id
    } catch {}

    // إنشاء JWT مخصص
    const customToken = jwt.sign(
      { customer_id: customerId, email: data.user_email, name: data.user_display_name, username: data.user_nicename },
      secret,
      { expiresIn: '7d' }
    )

    // إعداد Response + HttpOnly cookie
    const res = NextResponse.json({
      success: true,
      user: { customer_id: customerId, email: data.user_email, name: data.user_display_name }
    })

    res.cookies.set({
      name: 'token',
      value: customToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // مهم على Vercel
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 أيام
    })

    return res

  } catch (err) {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم', error: err.message }, { status: 500 })
  }
}
