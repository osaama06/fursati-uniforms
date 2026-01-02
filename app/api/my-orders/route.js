export const dynamic = 'force-dynamic'; // إجباري لـ Vercel ليقرأ الكوكيز دائماً

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح - لا يوجد توكن' }, { status: 401 });
    }

    // تأكد أن الـ Secret موجود
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in Vercel!");
      return NextResponse.json({ error: 'خطأ في إعدادات السيرفر' }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customerId = decoded?.customer_id || decoded?.id || decoded?.data?.user?.id;

    const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');
    
    // استخدام fetch مع كاش معطل تماماً
    const res = await fetch(`${process.env.WOO_URL}/wp-json/wc/v3/orders?customer=${customerId}`, {
      headers: { 
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // لضمان عدم الكاش في Vercel
    });

    const orders = await res.json();
    return NextResponse.json(orders);

  } catch (error) {
    return NextResponse.json({ error: 'الجلسة منتهية' }, { status: 401 });
  }
}