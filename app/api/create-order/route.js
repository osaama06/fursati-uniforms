// create-order/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import woocommerceApi from '@/lib/woocommerce';
import { verifyAppToken } from '@/lib/auth';

const sanitize = (str) => String(str || '').trim().replace(/<[^>]*>/g, '').slice(0, 500);

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody || '{}');
    const { cartItems, coupon_code } = body;

    const address  = sanitize(body.address);
    const city     = sanitize(body.city);
    const state    = sanitize(body.state);
    const postcode = sanitize(body.postcode);
    const phone    = sanitize(body.phone);
    const country  = sanitize(body.country) || 'SA';

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'المستخدم غير مسجل الدخول' }, { status: 401 });

    const payload = await verifyAppToken(token);
    if (!payload) return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });

    const customer_id = payload.customerId || payload.customer_id || payload.id || null;

    // ─── التحقق من الكوبون وحساب الخصم ──────────────────────────────────
    let discountAmount = 0;

    if (coupon_code) {
      const auth = Buffer.from(
        `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
      ).toString('base64');

      const couponRes  = await fetch(
        `https://furssati.io/wp-json/wc/v3/coupons?code=${encodeURIComponent(coupon_code)}`,
        { headers: { Authorization: `Basic ${auth}` }, cache: 'no-store' }
      );
      const couponData = await couponRes.json();

      if (couponData && couponData.length > 0) {
        const coupon   = couponData[0];
        const subtotal = cartItems.reduce((t, i) => t + parseFloat(i.price) * i.quantity, 0);

        if (coupon.discount_type === 'percent') {
          discountAmount = (subtotal * parseFloat(coupon.amount)) / 100;
        } else if (coupon.discount_type === 'fixed_cart') {
          discountAmount = Math.min(parseFloat(coupon.amount), subtotal);
        }
      }
    }

    // ─── بناء line_items بالسعر الأصلي بدون خصم ─────────────────────────
    const line_items = cartItems.map((item) => {
      const meta_data = [];

      const selectedAttributes = item.selectedAttributes || {};
      Object.entries(selectedAttributes).forEach(([key, value]) => {
        if (value) meta_data.push({ key, value });
      });

      const customFields = item.customFields || {};
      Object.entries(customFields).forEach(([key, field]) => {
        const label = field?.label || key;
        const value = field?.value ?? field;
        const price = field?.price;
        if (value) {
          const displayValue = price > 0 ? `${String(value)} (+${price} ر.س)` : String(value);
          meta_data.push({ key: label, value: displayValue });
        }
      });

      const itemTotal = parseFloat(item.price) * item.quantity;

      return {
        product_id:   item.productId || item.id,
        variation_id: item.variationId || 0,
        quantity:     item.quantity,
        subtotal:     itemTotal.toFixed(2),
        total:        itemTotal.toFixed(2),
        meta_data,
      };
    });

    const orderData = {
      payment_method:       'cod',
      payment_method_title: 'الدفع عند الاستلام',
      set_paid:             false,
      customer_id,
      billing: {
        first_name: payload.displayName || payload.name || 'عميل',
        last_name:  '',
        email:      payload.email || 'noemail@example.com',
        phone,
        address_1:  address,
        city,
        state,
        postcode,
        country,
      },
      shipping: {
        first_name: payload.displayName || payload.name || 'عميل',
        last_name:  '',
        phone,
        address_1:  address,
        city,
        state,
        postcode,
        country,
      },
      line_items,
      // ✅ الخصم في fee_lines فقط
      ...(coupon_code && discountAmount > 0 ? {
        fee_lines: [{
          name:  `خصم كوبون: ${coupon_code}`,
          total: `-${discountAmount.toFixed(2)}`,
        }]
      } : {}),
    };

    const { data } = await woocommerceApi.post('orders', orderData);

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error('❌ خطأ أثناء إنشاء الطلب:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || 'فشل إنشاء الطلب' },
      { status: 500 }
    );
  }
}