// app/api/my-orders/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const secret = process.env.WT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987';

export async function GET() {
  const cookieStore = await cookies(); // ✅ await
  const token = cookieStore.get('token')?.value; // ✅ اسم الكوكي: token

  if (!token) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log('decoded token:', decoded);

    const customerId = decoded?.customer_id || decoded?.data?.user?.id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'معرف العميل غير موجود' },
        { status: 400 }
      );
    }

    // جلب الطلبات من WooCommerce
    const timestamp = new Date().getTime();
    const url = `${process.env.WOO_URL}/wp-json/wc/v3/orders?customer=${customerId}&orderby=date&order=desc&per_page=10&_t=${timestamp}`;

    const auth = Buffer.from(
      `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
    ).toString('base64');

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.message || 'فشل في جلب الطلبات' },
        { status: res.status }
      );
    }

    const orders = await res.json();

    // Response مع headers لمنع Cache
    const response = NextResponse.json(orders);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error in GET /api/my-orders:', error);
    return NextResponse.json(
      { error: 'غير مصرح أو توكن غير صالح' },
      { status: 401 }
    );
  }
}