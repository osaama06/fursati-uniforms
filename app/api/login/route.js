// app/api/login/route.js
import { NextResponse } from 'next/server';
import { createAppToken } from '@/lib/auth';

const WP_JWT_URL = process.env.WOO_URL + '/wp-json/jwt-auth/v1/token';
const WOO_API_URL = process.env.WOO_URL + '/wp-json/wc/v3/customers';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password required' },
        { status: 400 }
      );
    }

    console.log('🔐 محاولة تسجيل دخول:', username);

    // 1️⃣ التحقق من WordPress
    const wpRes = await fetch(WP_JWT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!wpRes.ok) {
      console.log('❌ فشل التحقق من WordPress');
      return NextResponse.json(
        { success: false, message: 'بيانات غير صحيحة' },
        { status: 401 }
      );
    }

    const wpData = await wpRes.json();

    if (!wpData.token) {
      return NextResponse.json(
        { success: false, message: 'بيانات غير صحيحة' },
        { status: 401 }
      );
    }

    console.log('✅ تم التحقق من WordPress:', wpData.user_email);

    // 2️⃣ جلب customer_id من WooCommerce
    let customerId = null;
    
    try {
      const auth = Buffer.from(
        `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
      ).toString('base64');

      const customerRes = await fetch(
        `${WOO_API_URL}?email=${encodeURIComponent(wpData.user_email)}`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      if (customerRes.ok) {
        const customers = await customerRes.json();
        if (customers && customers.length > 0) {
          customerId = customers[0].id;
          console.log('✅ customer_id:', customerId);
        }
      }
    } catch (err) {
      console.warn('⚠️ خطأ في جلب العميل:', err.message);
    }

    // 3️⃣ إنشاء Token مخصص
    const customToken = createAppToken({
      customer_id: customerId,
      email: wpData.user_email,
      name: wpData.user_display_name,
      username: wpData.user_nicename
    });

    console.log('✅ تم إنشاء Token - customer_id:', customerId);

    // 4️⃣ إنشاء Response
    const response = NextResponse.json({
      success: true,
      token: customToken,
      user: {
        customer_id: customerId,
        email: wpData.user_email,
        name: wpData.user_display_name
      }
    });

    // 5️⃣ حفظ Cookie
    response.cookies.set('token', customToken, {  // ✅ اسم الكوكي: token
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
      path: '/'
    });

    console.log('🍪 تم حفظ Token في Cookie');

    return response;

  } catch (err) {
    console.error('❌ خطأ في الخادم:', err);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم', error: err.message },
      { status: 500 }
    );
  }
}