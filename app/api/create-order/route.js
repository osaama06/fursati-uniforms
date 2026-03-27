// create-order/route.js
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

    const customer_id = payload.customerId || payload.customer_id || payload.id || null;

    const line_items = cartItems.map((item) => {
      // نبني الـ meta_data من selectedAttributes و customFields
      const meta_data = [];

      // الـ attributes (مثل size, length, العرض, الطول)
      const selectedAttributes = item.selectedAttributes || {};
      Object.entries(selectedAttributes).forEach(([key, value]) => {
        if (value) {
          meta_data.push({
            key: key,       // مثال: "size" أو "length"
            value: value,   // مثال: "XL" أو "34 انش"
          });
        }
      });

      // الـ custom fields — كل entry شكلها { label, value }
      // مثال: { student_name: { label: "الاسم", value: "محمد" } }
      const customFields = item.customFields || {};
      Object.entries(customFields).forEach(([key, field]) => {
        const label = field?.label || key;
        const value = field?.value ?? field;
        if (value) {
          meta_data.push({
            key: label,    // يظهر في داشبورد WooCommerce كـ "الاسم"
            value: String(value),
          });
        }
      });

      return {
        // إذا عندنا variationId نرسله، وإلا نرسل productId
        product_id: item.productId || item.id,
        variation_id: item.variationId || 0,
        quantity: item.quantity,
        meta_data,
      };
    });

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
        country: country || 'SA',
      },
      shipping: {
        first_name: payload.displayName || payload.name || 'عميل',
        address_1: address || '',
        city: city || '',
        state: state || '',
        postcode: postcode || '',
        country: country || 'SA',
      },
      line_items,
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