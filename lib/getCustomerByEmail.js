// lib/getCustomerByEmail.js
// ─────────────────────────────────────────────────────────────────────────────
// جلب عميل WooCommerce ببريده — المصدر الوحيد لهذا الاستعلام.
// كان مكرر في ثلاث أماكن بثلاث جودات مختلفة، وهذا سبب الأخطاء.
//
// الحمايات:
//  1. ترميز البريد — بريد فيه + ما يتحول لمسافة ويرجع 400
//  2. فحص إن النتيجة مصفوفة — رد الخطأ من Woo كائن، و data[0].x كان يفرقع
//  3. التأكد إن العميل الراجع هو نفسه المطلوب — ما نثق بـ data[0] أبداً
//  4. البريد الفاضي يرجع null قبل ما نكلم Woo — ?email= يرجع 400
//
// null = ما فيه عميل مطابق.  يرمي = مشكلة اتصال/سيرفر (المستدعي يقرر وش يسوي).
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerByEmail(email) {
  const raw = String(email ?? '').trim();
  if (!raw) return null; // (4)

  const wanted = raw.toLowerCase();

  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString('base64');

  // (1) الترميز ضروري: + في query string ينفك كمسافة
  // role=all ضروري: بدونه Woo يفلتر على role=customer ويستثني حسابات الأدمن
  // فتسجيل دخولهم يفشل، وما يشوفون عنوانهم المحفوظ.
  const url = `${process.env.WOO_URL}/wp-json/wc/v3/customers?role=all&email=${encodeURIComponent(raw)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  // مشكلة من جهة Woo — نرميها عشان المستدعي يرجّع 500 بدل ما يقول "ما فيه عنوان"
  if (!res.ok) {
    throw new Error(`Woo customers lookup failed: ${res.status}`);
  }

  const data = await res.json();

  // (2) رد الخطأ من Woo كائن مو مصفوفة
  if (!Array.isArray(data) || data.length === 0) return null;

  // (3) لو فلتر البريد تعطّل أو انحذف، Woo يرجّع أول عميل في المتجر (حساب أدمن).
  // نتأكد إن الراجع هو نفسه المطلوب.
  const customer = data[0];
  if (String(customer?.email ?? '').trim().toLowerCase() !== wanted) return null;

  return customer;
}
