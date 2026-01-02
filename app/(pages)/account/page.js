import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import '@/styles/pages/account.css';

// تأكد أن هذا المتغير مطابق تماماً لما كان في الكود القديم
const secret = process.env.JWT_SECRET;

async function getCustomerData(email) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  try {
    const res = await fetch(`https://furssati.io/wp-json/wc/v3/customers?email=${email}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store'
    });
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) { return null; }
}

async function getRecentOrders(email) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  try {
    const res = await fetch(`https://furssati.io/wp-json/wc/v3/orders?email=${email}&per_page=3`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store'
    });
    return res.ok ? await res.json() : [];
  } catch (error) { return []; }
}

const statusTranslation = {
  'pending': { label: 'قيد الانتظار', class: 'pending' },
  'processing': { label: 'قيد التنفيذ', class: 'processing' },
  'on-hold': { label: 'بانتظار الدفع', class: 'on-hold' },
  'completed': { label: 'مكتمل', class: 'completed' },
  'cancelled': { label: 'ملغي', class: 'cancelled' },
  'refunded': { label: 'مسترجع', class: 'refunded' },
  'failed': { label: 'فشل الطلب', class: 'failed' },
};

export default async function AccountPage() {
  // استخدام نفس لوجيك الكوكيز القديم
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let decoded;
  try {
    // استخدمنا السيرفر سيكرت الصافي بدون فالباك لضمان عدم التضارب
    decoded = jwt.verify(token, secret);
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    redirect('/login');
  }

  // جلب البيانات مع الحفاظ على الأداء
  const [customerInfo, recentOrders] = await Promise.all([
    getCustomerData(decoded.email),
    getRecentOrders(decoded.email)
  ]);

  const finalName = customerInfo 
    ? `${customerInfo.first_name} ${customerInfo.last_name}`.trim() || customerInfo.username
    : decoded.name || decoded.username || decoded.email.split('@')[0];

  return (
    <main className="account-main" dir="rtl">
      {/* اليو اي الجديد اللي عجبك بدون أي تغيير */}
      <header className="account-hero-card">
        <div className="profile-flex">
          <div className="avatar-section">
            <div className="avatar-circle">{finalName.charAt(0).toUpperCase()}</div>
          </div>
          <div className="welcome-text">
            <h1>يا هلا، {finalName} 👋</h1>
            <p>{decoded.email}</p>
            <div className="user-meta-pills">
              <span className="meta-pill">{recentOrders.length} طلبات أخيرة</span>
              <span className="meta-pill">عضو 2025</span>
            </div>
          </div>
        </div>
      </header>

      <div className="account-grid">
        <aside className="account-sidebar">
          <nav className="side-nav">
            <Link href="/account" className="nav-link active">🏠 لوحة التحكم</Link>
            <Link href="/orders" className="nav-link">📦 طلباتي</Link>
            <Link href="/account/address" className="nav-link">📍 العناوين</Link>
            <Link href="/api/logout" className="nav-link logout-link">🚪 تسجيل الخروج</Link>
          </nav>
        </aside>

        <section className="account-body">
          <div className="content-header">
            <h2>📦 آخر 3 طلبات</h2>
            <Link href="/orders" className="text-link">مشاهدة الكل</Link>
          </div>

          <div className="orders-stack">
            {recentOrders.length === 0 ? (
              <p className="empty-msg">لا توجد طلبات حقيقية حالياً.</p>
            ) : (
              recentOrders.map((order) => {
                const statusInfo = statusTranslation[order.status] || { label: order.status, class: '' };
                return (
                  <div key={order.id} className="order-item-row">
                    <div className="order-main-info">
                      <span className="order-number">#{order.id}</span>
                      <span className="order-date">{new Date(order.date_created).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className={`status-tag ${statusInfo.class}`}>
                      {statusInfo.label}
                    </div>
                    <div className="order-amount">{order.total} ر.س</div>
                    <Link href={`/orders/${order.id}`} className="order-action-btn">التفاصيل</Link>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}