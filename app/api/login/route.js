import { NextResponse } from 'next/server';
import { createAppToken } from '@/lib/auth';

const WP_JWT_URL = process.env.WOO_URL + '/wp-json/jwt-auth/v1/token';
const WP_API_URL = process.env.WOO_URL + '/wp-json/wc/v3/customers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const wpAuthResponse = await fetch(WP_JWT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!wpAuthResponse.ok) {
      const error = await wpAuthResponse.json();
      return NextResponse.json({ error: error.message || 'بيانات تسجيل الدخول غير صحيحة' }, { status: 401 });
    }

    const wpData = await wpAuthResponse.json();
    const userId = wpData.user_id || wpData.ID;
    const email = wpData.user_email;
    const displayName = wpData.user_display_name || wpData.user_nicename;

    let customerId;
    try {
      const customerResponse = await fetch(`${WP_API_URL}?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64')}`,
        },
      });
      if (customerResponse.ok) {
        const customers = await customerResponse.json();
        if (customers.length > 0) customerId = customers[0].id;
      }
    } catch (error) {
      console.warn('Failed to fetch customer_id:', error);
    }

    const appToken = await createAppToken({ userId, email, displayName, customerId });

    const response = NextResponse.json({ success: true, user: { userId, email, displayName, customerId } }, { status: 200 });

    response.cookies.set({
      name: 'auth_token',
      value: appToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}