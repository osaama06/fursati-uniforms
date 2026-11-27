// app/api/account/update-address/route.js
// ─────────────────────────────────────────────────────────────────────────────
// الهوية من التوكن فقط. أي customerId يجي من المتصفح يتم تجاهله.
// وحقول billing تمر على قائمة بيضاء — ما نعدي للـ Woo إلا حقول العنوان.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAppToken } from '@/lib/auth';
import { isValidShortNationalAddress, normalizeShortNationalAddress } from '@/lib/shortNationalAddress';

// حقول العنوان فقط. email/password/username/role وأي شي ثاني ما يمر.
const ALLOWED_BILLING_FIELDS = ['first_name', 'last_name', 'phone', 'address_1', 'city', 'state'];

export async function POST(req) {
  // ─── الهوية: من التوكن، لا من الطلب ───
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const payload = verifyAppToken(token);
  if (!payload) return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });

  // نفس ترتيب api/create-order و api/my-orders
  const customerId =
    payload.customer_id || payload?.data?.user?.id || payload.customerId || payload.id || 0;

  // التحقق الرقمي إلزامي — القيمة تندرج في رابط الـ PUT،
  // وقيمة فيها "/.." تخلي fetch يطبّعها وتهبط على مسار ثاني بمفاتيح الأدمن.
  if (!/^\d+$/.test(String(customerId)) || Number(customerId) <= 0) {
    return NextResponse.json({ error: 'حساب غير مكتمل' }, { status: 400 });
  }

  // ملاحظة: customerId اللي في الـ body يُتجاهل تماماً — ما نفكّه أصلاً.
  const { billing } = await req.json();

  const normalizedPostcode = normalizeShortNationalAddress(billing?.postcode);
  if (!isValidShortNationalAddress(normalizedPostcode)) {
    return NextResponse.json(
      { error: 'العنوان الوطني المختصر يجب أن يكون 4 أحرف إنجليزية ثم 4 أرقام (مثل ABCD1234)' },
      { status: 400 }
    );
  }

  // ─── القائمة البيضاء ───
  // الدولة والعنوان الوطني مفروضين من السيرفر دائماً.
  // الباقي ننسخه إذا وصل فقط — PUT في Woo يدمج المفاتيح المرسلة،
  // فلو عبّينا الناقص بـ '' نكون مسحنا بيانات محفوظة (الفورم ما يرسل state).
  const safeBilling = { postcode: normalizedPostcode, country: 'SA' };
  for (const key of ALLOWED_BILLING_FIELDS) {
    if (billing?.[key] !== undefined) safeBilling[key] = String(billing[key]);
  }

  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');

  try {
    const res = await fetch(`${process.env.WOO_URL}/wp-json/wc/v3/customers/${customerId}`, {
      method: 'PUT',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing: safeBilling }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}
