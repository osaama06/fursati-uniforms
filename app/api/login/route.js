import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import woocommerceApi from '@/lib/woocommerce'

const secret = process.env.JWT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'البيانات ناقصة' },
        { status: 400 }
      )
    }

    // 1️⃣ Verify with WP JWT endpoint
    const wpRes = await fetch(
      'https://furssati.io/wp-json/jwt-auth/v1/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }
    )

    if (!wpRes.ok) {
      return NextResponse.json(
        { success: false, message: 'بيانات غير صحيحة' },
        { status: 401 }
      )
    }

    const data = await wpRes.json()
    
    if (!data?.token || !data?.user_email) {
      return NextResponse.json(
        { success: false, message: 'فشل التوثيق' },
        { status: 500 }
      )
    }

    // 2️⃣ Try to get customer_id from WooCommerce
    let customerId = null
    try {
      const customerRes = await woocommerceApi.get('customers', {
        email: data.user_email
      })
      if (Array.isArray(customerRes.data) && customerRes.data.length > 0) {
        customerId = customerRes.data[0].id
      }
    } catch (e) {
      // ignore
    }

    // 3️⃣ Sign internal JWT (30 days)
    const customToken = jwt.sign(
      {
        customer_id: customerId,
        email: data.user_email,
        name: data.user_display_name,
        username: data.user_nicename
      },
      secret,
      { expiresIn: '30d' }
    )

    const responsePayload = {
      success: true,
      token: customToken, // ✅ أرجع التوكن للـ client
      user: {
        customer_id: customerId,
        email: data.user_email,
        name: data.user_display_name
      }
    }

    // ✅ CRITICAL FIX: إنشاء Response أولاً
    const response = NextResponse.json(responsePayload, { status: 200 })

    // ✅ إضافة الكوكي للـ Response
    response.cookies.set({
      name: 'token',
      value: customToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    // ✅ حفظ في cookieStore أيضاً (للـ middleware)
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'token',
      value: customToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    return response

  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'