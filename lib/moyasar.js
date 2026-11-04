// lib/moyasar.js
// ─────────────────────────────────────────────────────────────────────────────
// منطق التحقق من الدفع — يُستخدم من الـ callback والـ webhook.
// القاعدة: ما نصدّق أي حالة دفع إلا بعد ما نجيب الدفعة من ميسر بالمفتاح السري.
// ─────────────────────────────────────────────────────────────────────────────
import woocommerceApi from '@/lib/woocommerce';

const MOYASAR_API = 'https://api.moyasar.com/v1';
const PAYMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authHeader() {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error('MOYASAR_SECRET_KEY is not set');
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

export async function fetchMoyasarPayment(paymentId) {
  if (!PAYMENT_ID_RE.test(String(paymentId || ''))) {
    throw new Error('Invalid Moyasar payment id');
  }
  const res = await fetch(`${MOYASAR_API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Moyasar fetch failed: ${res.status}`);
  return res.json();
}

async function addOrderNote(orderId, note) {
  try {
    await woocommerceApi.post(`orders/${orderId}/notes`, { note });
  } catch (e) {
    console.error('Order note failed:', e.response?.data || e.message);
  }
}

/**
 * الدفع فشل (تأكدنا من ميسر نفسه) → الطلب يصير failed بدل ما يظل pending.
 * ما نلمس الطلب إلا إذا كان لسا pending وطريقة دفعه ميسر.
 * فشل هذي الخطوة ما يأثر على العميل.
 */
async function markOrderFailed(orderId, payment) {
  try {
    const { data: order } = await woocommerceApi.get(`orders/${orderId}`);
    if (order.status !== 'pending' || order.payment_method !== 'moyasar') return;
    await woocommerceApi.put(`orders/${orderId}`, { status: 'failed' });
    await addOrderNote(
      orderId,
      `❌ فشل الدفع عبر ميسر — رقم العملية: ${payment.id} — السبب: ${payment?.source?.message || payment.status}`
    );
  } catch (e) {
    console.error(`markOrderFailed ${orderId}:`, e.response?.data || e.message);
  }
}

/**
 * يتحقق من الدفعة ويحدّث الطلب في WooCommerce.
 * آمن للتكرار: لو الـ callback والـ webhook وصلوا مع بعض، الطلب يتحدث مرة وحدة.
 *
 * النتائج:
 *  - paid    : الدفع ناجح والطلب صار processing
 *  - failed  : الدفع ما نجح
 *  - review  : انسحب المبلغ لكن فيه عدم تطابق — الطلب on-hold للمراجعة اليدوية
 *  - invalid : الدفعة ما تخص هذا الطلب أو بياناتها ناقصة
 */
export async function finalizeMoyasarPayment(paymentId, expectedOrderId = null) {
  const payment = await fetchMoyasarPayment(paymentId);

  const orderId = String(payment?.metadata?.order_id || '');
  if (!orderId) return { result: 'invalid' };
  if (expectedOrderId && String(expectedOrderId) !== orderId) return { result: 'invalid' };

  if (payment.status !== 'paid') {
    await markOrderFailed(orderId, payment);
    return { result: 'failed', orderId, message: payment?.source?.message || null };
  }

  // من هنا الفلوس انسحبت فعلاً. أي فشل في WooCommerce (بطء، timeout) ما يعني إن الدفع فشل.
  // نرجّع 'confirming': العميل يشوف إن الدفع نجح، والـ webhook يعيد المحاولة ويحدّث الطلب.
  try {
    const { data: order } = await woocommerceApi.get(`orders/${orderId}`);

    if (order.payment_method !== 'moyasar') {
      await addOrderNote(orderId, `⚠️ وصلت دفعة ميسر (${payment.id}) لطلب طريقة دفعه ليست ميسر — راجعها يدوياً.`);
      return { result: 'review', orderId };
    }

    // تم تحديثه قبل كذا بنفس الدفعة (callback + webhook)
    if (order.transaction_id === payment.id && ['processing', 'completed'].includes(order.status)) {
      return { result: 'paid', orderId };
    }

    // الطلب مدفوع بدفعة ثانية — دفع مكرر
    if (order.transaction_id && order.transaction_id !== payment.id && order.date_paid) {
      await addOrderNote(
        orderId,
        `⚠️ دفعة مكررة عبر ميسر: ${payment.id} بمبلغ ${(payment.amount / 100).toFixed(2)} ر.س — الطلب مدفوع مسبقاً بـ ${order.transaction_id}. استرجع المبلغ من لوحة ميسر.`
      );
      return { result: 'review', orderId };
    }

    const expectedAmount = Math.round(parseFloat(order.total) * 100);
    const currencyOk = String(payment.currency).toUpperCase() === String(order.currency || 'SAR').toUpperCase();

    if (payment.amount !== expectedAmount || !currencyOk) {
      await woocommerceApi.put(`orders/${orderId}`, {
        status: 'on-hold',
        transaction_id: payment.id,
      });
      await addOrderNote(
        orderId,
        `⚠️ عدم تطابق في الدفع: المدفوع ${(payment.amount / 100).toFixed(2)} ${payment.currency}، المطلوب ${(expectedAmount / 100).toFixed(2)} ${order.currency}. رقم العملية: ${payment.id}`
      );
      return { result: 'review', orderId };
    }

    await woocommerceApi.put(`orders/${orderId}`, {
      status: 'processing',
      set_paid: true,
      transaction_id: payment.id,
    });
    await addOrderNote(
      orderId,
      `✅ تم الدفع عبر ميسر — رقم العملية: ${payment.id} — المبلغ: ${(payment.amount / 100).toFixed(2)} ر.س${
        payment?.source?.company ? ` — ${payment.source.company}` : ''
      }`
    );

    return { result: 'paid', orderId };
  } catch (error) {
    console.error(
      `⚠️ الدفع ${payment.id} ناجح لكن تحديث الطلب ${orderId} فشل — الـ webhook بيعيد المحاولة:`,
      error.response?.data || error.message
    );
    return { result: 'confirming', orderId };
  }
}