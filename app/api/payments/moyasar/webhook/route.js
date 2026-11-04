// app/api/payments/moyasar/webhook/route.js
// احتياط: لو العميل سكّر الصفحة قبل ما يرجع للـ callback، ميسر يبلّغنا هنا.
// الرابط اللي تحطه في لوحة ميسر: https://www.fursatiuniforms.com/api/payments/moyasar/webhook
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { finalizeMoyasarPayment } from '@/lib/moyasar';

export const dynamic = 'force-dynamic';

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!safeEqual(body?.secret_token, process.env.MOYASAR_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (body.type !== 'payment_paid') {
    return NextResponse.json({ ok: true, ignored: body.type });
  }

  const paymentId = body?.data?.id;
  if (!paymentId) return NextResponse.json({ ok: true, ignored: 'no payment id' });

  try {
    // نعيد جلب الدفعة من ميسر بدل ما نصدّق محتوى الـ webhook
    const r = await finalizeMoyasarPayment(paymentId);
    return NextResponse.json({ ok: true, result: r.result });
  } catch (error) {
    console.error('❌ Moyasar webhook error:', error.response?.data || error.message);
    // 500 عشان ميسر يعيد المحاولة
    return NextResponse.json({ error: 'processing failed' }, { status: 500 });
  }
}