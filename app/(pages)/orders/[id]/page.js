// app/orders/[id]/page.js
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyAppToken } from '@/lib/auth';
import { getStatusInfo, getStage, STEPS } from '../orderStatus';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تفاصيل الطلب | فرصتي',
  robots: { index: false, follow: false },
};

async function getOrderDetails(orderId) {
  if (!/^\d+$/.test(String(orderId))) return null;
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');
  try {
    const res = await fetch(`https://fursatiuniforms.store/wp-json/wc/v3/orders/${orderId}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// العميل يشوف طلباته هو بس — بالـ customer_id أو بالإيميل
function isOwner(order, payload) {
  const customerId = Number(
    payload?.customer_id || payload?.data?.user?.id || payload?.customerId || payload?.id || 0
  );
  if (customerId && Number(order.customer_id) === customerId) return true;

  const email = String(payload?.email || '').trim().toLowerCase();
  const orderEmail = String(order?.billing?.email || '').trim().toLowerCase();
  return Boolean(email) && email === orderEmail;
}

const money = (v) => `${parseFloat(v || 0).toFixed(2)} ر.س`;
const isUrl = (v) => /^https?:\/\//i.test(String(v || ''));

function NotFound() {
  return (
    <main dir="rtl" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <p style={{ marginBottom: '1rem' }}>الطلب غير موجود</p>
      <Link href="/orders" style={{ color: '#00c2cb', fontWeight: 'bold', textDecoration: 'none' }}>العودة لطلباتي</Link>
    </main>
  );
}

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;

  // ─── التحقق من المستخدم ───
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? await verifyAppToken(token) : null;
  if (!payload) {
    return (
      <main dir="rtl" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <p style={{ marginBottom: '1rem' }}>سجّل دخولك عشان تشوف طلبك</p>
        <Link href="/login" style={{ color: '#00c2cb', fontWeight: 'bold', textDecoration: 'none' }}>تسجيل الدخول</Link>
      </main>
    );
  }

  const order = await getOrderDetails(id);
  // نفس الرسالة للطلب المحذوف وطلب عميل ثاني — ما نكشف وجود الطلب
  if (!order || !isOwner(order, payload)) return <NotFound />;

  const statusInfo = getStatusInfo(order.status);
  const stage = getStage(order.status);
  const awaitingPayment = order.status === 'pending' && order.payment_method === 'moyasar';

  const subtotal = (order.line_items || []).reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0);
  const discount = parseFloat(order.discount_total || 0);
  const shipping = parseFloat(order.shipping_total || 0);
  const fees = (order.fee_lines || []).filter((f) => parseFloat(f.total) > 0);

  return (
    <main dir="rtl" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem', color: '#2d3748' }}>

      {/* الهيدر */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/orders" style={{ color: '#00c2cb', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>← العودة للسجل</Link>
          <h1 style={{ margin: '0.5rem 0', fontSize: '1.8rem' }}>تفاصيل طلبك #{order.number || order.id}</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>
            تاريخ الطلب: {new Date(order.date_created).toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div style={{ background: statusInfo.bg, color: statusInfo.color, padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}>
          الحالة: {statusInfo.label}
        </div>
      </header>

      {/* ─── التتبع ─── */}
      {stage === null ? (
        <section style={{ background: statusInfo.bg, color: statusInfo.color, padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
          هذا الطلب {statusInfo.label}. لأي استفسار تواصل معنا.
        </section>
      ) : (
        <section style={{ background: '#fff', padding: '2.5rem 1.5rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '2rem', overflow: 'hidden' }}>
          {awaitingPayment && (
            <p style={{ textAlign: 'center', color: '#f08c00', fontWeight: 'bold', marginTop: 0, marginBottom: '1.5rem' }}>
              الطلب بانتظار تأكيد الدفع
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {STEPS.map((label, index) => {
              const isDone = index <= stage;
              const isCurrent = index === stage;
              const lineDone = index < stage; // الخط بين هذي المرحلة واللي بعدها
              return (
                <div key={label} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '35px', height: '35px', borderRadius: '50%', margin: '0 auto 10px',
                    background: isDone ? '#00c2cb' : '#f1f5f9', color: isDone ? '#fff' : '#cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                    border: '4px solid #fff',
                    boxShadow: isCurrent ? '0 0 0 3px #b2f0f3' : '0 0 0 1px #e2e8f0',
                  }}>
                    {isDone ? '✓' : index + 1}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: isCurrent ? '800' : '700', color: isDone ? '#2d3748' : '#a0aec0' }}>
                    {label}
                  </span>

                  {/* الخط الواصل للمرحلة اللي بعدها (RTL: يمتد لليسار) */}
                  {index < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: '18px', left: '-50%', width: '100%', height: '2px',
                      background: lineDone ? '#00c2cb' : '#e2e8f0', zIndex: -1,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* المحتوى الرئيسي */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* المنتجات */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🛒 المنتجات في شحنتك</h3>
          {(order.line_items || []).map((item) => {
            const meta = (item.meta_data || []).filter(
              (m) => !String(m.key).startsWith('_') && (m.display_value ?? m.value) !== ''
            );
            return (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
                {item.image?.src ? (
                  <img src={item.image.src} alt={item.name} width={50} height={50}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px', background: '#f8fafc' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#718096' }}>
                    الكمية: {item.quantity} × {parseFloat(item.price || 0).toFixed(2)} ر.س
                  </p>
                  {meta.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {meta.map((m) => {
                        const key = m.display_key || m.key;
                        const value = String(m.display_value ?? m.value).replace(/<[^>]*>/g, '');
                        return (
                          <span key={m.id || key} style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#4a5568' }}>
                            {key}:{' '}
                            {isUrl(value)
                              ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#00c2cb' }}>عرض الصورة</a>
                              : value}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{money(item.total)}</div>
              </div>
            );
          })}
        </div>

        {/* ملخص الدفع وعنوان الشحن */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* الملخص */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ marginBottom: '1rem' }}>💰 تفاصيل الدفع</h3>

            <Row label="المجموع الفرعي" value={money(subtotal)} />
            {discount > 0 && (
              <Row
                label={`الخصم${order.coupon_lines?.length ? ` (${order.coupon_lines.map((c) => c.code).join('، ')})` : ''}`}
                value={`- ${money(discount)}`}
                color="#276749"
              />
            )}
            <Row label="الشحن" value={shipping === 0 ? 'مجاني' : money(shipping)} />
            {fees.map((f) => (
              <Row key={f.id} label={f.name} value={money(f.total)} />
            ))}
            {order.payment_method_title && (
              <Row label="طريقة الدفع" value={order.payment_method_title} color="#718096" />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed #eee' }}>
              <span style={{ fontWeight: 'bold' }}>الإجمالي الكلي</span>
              <span style={{ fontWeight: '900', fontSize: '1.3rem', color: '#00c2cb' }}>{money(order.total)}</span>
            </div>
          </div>

          {/* عنوان الشحن */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>📍 عنوان الشحن</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#4a5568' }}>
              {order.shipping?.first_name} {order.shipping?.last_name}<br />
              {order.shipping?.address_1}<br />
              {order.shipping?.city}{order.shipping?.state ? `، ${order.shipping.state}` : ''}<br />
              {order.shipping?.phone || order.billing?.phone}
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}