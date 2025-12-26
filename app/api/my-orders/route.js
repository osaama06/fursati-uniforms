//my-orders/route
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log('decoded token:', decoded);

    const customerId = decoded?.customer_id || decoded?.data?.user?.id;

    if (!customerId) {
      return NextResponse.json({ error: 'معرف العميل غير موجود' }, { status: 400 });
    }

    // إضافة timestamp لمنع الـ caching
    const timestamp = new Date().getTime();
    const url = `${process.env.WOO_URL}/wp-json/wc/v3/orders?customer=${customerId}&orderby=date&order=desc&per_page=10&_t=${timestamp}`;

    const res = await fetch(url, {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64'),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-LiteSpeed-Cache': 'no-cache', // خاص بـ LiteSpeed
        'X-LiteSpeed-Purge': '*', // مسح الـ cache
        'X-LiteSpeed-Tag': 'no-cache'
      },
      cache: 'no-store', // منع Next.js من تخزين الاستجابة
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.message || 'فشل في جلب الطلبات' }, { status: res.status });
    }

    const orders = await res.json();

    // إضافة headers لمنع تخزين الاستجابة في المتصفح
    const response = NextResponse.json(orders);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;

  } catch (error) {
    console.log('Error in GET /api/my-orders:', error);
    return NextResponse.json({ error: 'غير مصرح أو توكن غير صالح' }, { status: 401 });
  }
}