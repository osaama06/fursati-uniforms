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
      console.error('Woo Error:', e.message)
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
      { expiresIn: '30d' }
    )

    // 4️⃣ إنشاء Response (لا ترجعه فوراً)
    const response = NextResponse.json({
      success: true,
      token: customToken,
      user: {
        customer_id: customerId,
        email: data.user_email,
        name: data.user_display_name
      }
    })

    // 5️⃣ حفظ Cookie باستخدام الطريقة الأضمن لـ Vercel
    // في Next 15، يفضل استخدام cookieStore قبل الـ return
    const cookieStore = await cookies()

    cookieStore.set({
      name: 'token',
      value: customToken,
      httpOnly: true,
      secure: true, // إجباري true في Vercel لأن الدومين HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
      path: '/',
    })

    // 6️⃣ الحل الجذري: تأكيد إرسال الكوكي في الـ Headers يدوياً لضمان عدم حذفها
    response.headers.set('Set-Cookie', cookieStore.toString())

    return response

  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}