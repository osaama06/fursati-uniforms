// app/api/login/route.js
import { NextResponse } from 'next/server';
import { createAppToken } from '@/lib/auth';
import { getCustomerByEmail } from '@/lib/getCustomerByEmail';

const WP_JWT_URL = process.env.WOO_URL + '/wp-json/jwt-auth/v1/token';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password required' },
        { status: 400 }
      );
    }

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

    // 2️⃣ جلب العميل من WooCommerce — getCustomerByEmail تطابق البريد،
    //    فما نربط الجلسة بعميل ثاني لو تغيّر سلوك فلتر Woo.
    let customer;
    try {
      customer = await getCustomerByEmail(wpData.user_email);
    } catch {
      // عطل اتصال/سيرفر — ما نصدر توكن ناقص، نطلب إعادة المحاولة
      return NextResponse.json(
        { success: false, message: 'تعذّر تحميل حسابك، حاول مرة ثانية' },
        { status: 503 }
      );
    }

    // بلا customer_id الطلبات تنعمل كطلبات يتيمة وما تظهر في "طلباتي"
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'حسابك غير مكتمل، تواصل مع الدعم' },
        { status: 403 }
      );
    }

    // 3️⃣ إنشاء Token مخصص
    const customToken = createAppToken({
      customer_id: customer.id,
      email: wpData.user_email,
      name: wpData.user_display_name,
      username: wpData.user_nicename
    });

    // 4️⃣ إنشاء Response — التوكن في الكوكي httpOnly فقط، ما نرجعه في الجسم
    const response = NextResponse.json({
      success: true,
      user: {
        customer_id: customer.id,
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
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}