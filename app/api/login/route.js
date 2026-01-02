// app/api/login/route.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import woocommerceApi from '@/lib/woocommerce'

const secret = process.env.JWT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    console.log('🔐 محاولة تسجيل دخول:', username)

    // 1️⃣ التحقق من WordPress
    const wpRes = await fetch('https://furssati.io/wp-json/jwt-auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!wpRes.ok) {
      console.log('❌ فشل التحقق من WordPress')
      return NextResponse.json(
        { success: false, message: 'بيانات غير صحيحة' },
        { status: 401 }
      )
    }

    const data = await wpRes.json()

    if (!data.token) {
      return NextResponse.json(
        { success: false, message: 'بيانات غير صحيحة' },
        { status: 401 }
      )
    }

    console.log('✅ تم التحقق من WordPress:', data.user_email)

    // 2️⃣ جلب customer_id من WooCommerce
    let customerId = null

    try {
      const customerRes = await woocommerceApi.get('customers', {
        email: data.user_email
      })

      if (customerRes.data && customerRes.data.length > 0) {
        customerId = customerRes.data[0].id
        console.log('✅ customer_id:', customerId)
      } else {
        console.warn('⚠️ لم يتم العثور على العميل في WooCommerce')
      }
    } catch (err) {
      console.warn('⚠️ خطأ في جلب العميل:', err.message)
    }

    // 3️⃣ إنشاء توكن مخصص
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

    console.log('✅ تم إنشاء Token - customer_id:', customerId)

    // 4️⃣ إنشاء Response
    const response = NextResponse.json({
      success: true,
      token: customToken, // إرجاع Token للفرونت أيضاً
      user: {
        customer_id: customerId,
        email: data.user_email,
        name: data.user_display_name
      }
    })

    // 5️⃣ حفظ Cookie بطريقة Production-ready
    response.cookies.set('token', customToken, {
      httpOnly: true,        // لا يمكن الوصول من JS
      secure: true,          // 🔥 مهم جدًا على Vercel (Production HTTPS)
      sameSite: 'lax',       // يسمح بالطلبات العادية
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
      path: '/',             // متاح لكل الموقع
    })

    console.log('🍪 تم حفظ Token في Cookie بنجاح')
    console.log('📤 Token length:', customToken.length)

    return response

  } catch (err) {
    console.error('❌ خطأ في الخادم:', err)
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم', error: err.message },
      { status: 500 }
    )
  }
}
