import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import woocommerceApi from '@/lib/woocommerce'

const secret = process.env.JWT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987'

export async function POST(request) {
  const { username, password } = await request.json()

  try {
    const wpRes = await fetch('https://furssati.io/wp-json/jwt-auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await wpRes.json()

    if (data.token) {
      // 🔍 نحصل على customer_id من WooCommerce
      let customerId = null
      try {
        const customerRes = await woocommerceApi.get('customers', {
          search: data.user_email
        })

        if (customerRes.data && customerRes.data.length > 0) {
          customerId = customerRes.data[0].id
        }
      } catch (err) {
        console.warn('⚠️ لم يتم العثور على العميل في WooCommerce:', err.message)
      }

      // 🛡️ إنشاء توكن خاص يحتوي على customer_id
      const customToken = jwt.sign(
        {
          email: data.user_email,
          name: data.user_display_name,
          username: data.user_nicename,
          wpToken: data.token,
          customer_id: customerId || null
        },
        secret,
        { expiresIn: '1d' }
      )

      const response = NextResponse.json({ message: 'تم تسجيل الدخول' })
      response.cookies.set('token', customToken, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production'
      })

      return response
    } else {
      return NextResponse.json({ message: 'بيانات غير صحيحة' }, { status: 401 })
    }

  } catch (err) {
    return NextResponse.json({ message: 'خطأ في الخادم', error: err.message }, { status: 500 })
  }
}