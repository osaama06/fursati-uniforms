import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

export async function GET() {
  // التعديل الجوهري لـ Next.js 15: إضافة await
  const cookieStore = await cookies(); 
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, secret);
    
    // تأكد من الـ Path الخاص بالـ ID في التوكن
    // الكود القديم كان يبحث في مسارين، أبقيت عليهما لضمان التوافق
    const customerId = decoded?.customer_id || decoded?.data?.user?.id || decoded?.id;

    if (!customerId) {
      return NextResponse.json({ error: 'معرف العميل غير موجود' }, { status: 400 });
    }

    const timestamp = new Date().getTime();
    const url = `${process.env.WOO_URL}/wp-json/wc/v3/orders?customer=${customerId}&orderby=date&order=desc&per_page=10&_t=${timestamp}`;

    const res = await fetch(url, {
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64'),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-LiteSpeed-Cache': 'no-cache',
        'X-LiteSpeed-Purge': '*',
        'X-LiteSpeed-Tag': 'no-cache'
      },
      cache: 'no-store', 
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.message || 'فشل في جلب الطلبات' }, { status: res.status });
    }

    const orders = await res.json();

    const response = NextResponse.json(orders);
    // الحفاظ على قوة منع الـ Caching لضمان ظهور الطلبات الجديدة فوراً
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