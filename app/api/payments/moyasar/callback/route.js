// app/api/payments/moyasar/callback/route.js
// ميسر يرجّع العميل هنا بعد الدفع: ?id=...&status=...&message=...&order_id=...
// ما نعتمد على status اللي في الرابط — نتحقق من ميسر مباشرة.
import { NextResponse } from 'next/server';
import { finalizeMoyasarPayment } from '@/lib/moyasar';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('id');
  const orderId = url.searchParams.get('order_id');
  const callbackMessage = url.searchParams.get('message');

  const redirectTo = new URL('/checkout/result', url.origin);

  if (!paymentId) {
    redirectTo.searchParams.set('status', 'failed');
    if (orderId) redirectTo.searchParams.set('order', orderId);
    return NextResponse.redirect(redirectTo, 303);
  }

  try {
    const r = await finalizeMoyasarPayment(paymentId, orderId);
    redirectTo.searchParams.set('status', r.result);
    if (r.orderId) redirectTo.searchParams.set('order', r.orderId);
    const message = r.message || (r.result === 'failed' ? callbackMessage : null);
    if (message) redirectTo.searchParams.set('message', String(message).slice(0, 200));
  } catch (error) {
    console.error('❌ Moyasar callback error:', error.response?.data || error.message);
    redirectTo.searchParams.set('status', 'error');
    if (orderId) redirectTo.searchParams.set('order', orderId);
  }

  return NextResponse.redirect(redirectTo, 303);
}