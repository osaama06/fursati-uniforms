import { NextResponse } from 'next/server';

export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'أدخل كود الكوبون' }, { status: 400 });

  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');

  try {
    const res = await fetch(`https://furssati.io/wp-json/wc/v3/coupons?code=${code.trim()}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });
    const data = await res.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'الكوبون غير صالح' }, { status: 404 });
    }

    const coupon = data[0];

    // التحقق من انتهاء الصلاحية
    if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
      return NextResponse.json({ error: 'انتهت صلاحية الكوبون' }, { status: 400 });
    }

    // التحقق من عدد مرات الاستخدام
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'تم استنفاد هذا الكوبون' }, { status: 400 });
    }

    // التحقق من الحد الأدنى للطلب
    const minAmount = parseFloat(coupon.minimum_amount || 0);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type, // percent, fixed_cart, fixed_product
      amount: parseFloat(coupon.amount),
      minimum_amount: minAmount,
      description: coupon.description || '',
    });
  } catch {
    return NextResponse.json({ error: 'خطأ في التحقق من الكوبون' }, { status: 500 });
  }
}