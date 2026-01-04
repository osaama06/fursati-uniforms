import { NextResponse } from 'next/server'
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

    // 1️⃣ التحقق من WordPress
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
        { success: false, message: 'فشل التحقق' },
        { status: 401 }
      )
    }

    // 2️⃣ جلب customer_id من WooCommerce
    let customerId = null

    try {
      const customerRes = await woocommerceApi.get('customers', {
        email: data.user_email
      })

      if (Array.isArray(customerRes.data) && customerRes.data.length > 0) {
        customerId = customerRes.data[0].id
      }
    } catch (e) {
      // تجاهل الخطأ بدون كسر اللوقن
    }

    // 3️⃣ إنشاء JWT
    const customToken = jwt.sign(
      {
        customer_id: customerId,
        email: data.user_email,
        name: data.user_display_name,
        username: data.user_nicename
      },
      secret,
      { expiresIn: '7d' }
    )

    // 4️⃣ إنشاء Response
    const response = NextResponse.json({
      success: true,
      token: customToken,
      user: {
        customer_id: customerId,
        email: data.user_email,
        name: data.user_display_name
      }
    })

    // 5️⃣ حفظ Cookie (الصيغة الصح)
    response.cookies.set({
      name: 'token',
      value: customToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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
