//create-order/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import woocommerceApi from '@/lib/woocommerce';
import { verifyAppToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody || '{}');

    const { cartItems, address, city, state, postcode, country } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'المستخدم غير مسجل الدخول' }, { status: 401 });
    }

    const payload = await verifyAppToken(token);
    if (!payload) return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });

    const customer_id = payload.customerId || payload.customerId || payload.customer_id || payload.id || null;

    const line_items = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const orderData = {
      payment_method: 'cod',
      payment_method_title: 'الدفع عند الاستلام',
      set_paid: false,
      customer_id,
      billing: {
        first_name: payload.displayName || payload.name || 'عميل',
        email: payload.email || 'noemail@example.com',
        address_1: address || '',
        city: city || '',
        state: state || '',
        postcode: postcode || '',
        country: country || 'SA'
      },
      shipping: {
        first_name: payload.displayName || payload.name || 'عميل',
        address_1: address || '',
        city: city || '',
        state: state || '',
        postcode: postcode || '',
        country: country || 'SA'
      },
      line_items
    };

    const { data } = await woocommerceApi.post('orders', orderData);

    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error('❌ خطأ أثناء إنشاء الطلب:', error.response?.data || error.message);
    return NextResponse.json({
      error: error.response?.data || 'فشل إنشاء الطلب'
    }, { status: 500 });
  }
}
