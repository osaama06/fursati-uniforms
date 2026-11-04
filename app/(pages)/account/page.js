import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';
import WishlistSection from './WishlistSection';
import { getStatusInfo, isHiddenFromCustomer } from '../orders/orderStatus';
import '@/styles/pages/account.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: 'noindex, nofollow',
};

const secret = process.env.WT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987';

async function getCustomerData(email) {
  if (!email) return null;
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');
  try {
    const res = await fetch(
      `https://fursatiuniforms.store/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Basic ${auth}` },
        cache: 'no-store',
      }
    );
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function getRecentOrders(customerId) {
  if (!customerId) return [];
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');
  try {
    // نجيب 10 ونفلتر محاولات الدفع الفاشلة، وبعدها ناخذ آخر 3
    const res = await fetch(
      `https://fursatiuniforms.store/wp-json/wc/v3/orders?customer=${customerId}&orderby=date&order=desc&per_page=10`,
      {
        headers: { Authorization: `Basic ${auth}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    const orders = await res.json();
    return (Array.isArray(orders) ? orders : []).filter((o) => !isHiddenFromCustomer(o)).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    redirect('/login');
  }

  const customerId = decoded?.customer_id || decoded?.data?.user?.id;

  const [customerInfo, recentOrders] = await Promise.all([
    getCustomerData(decoded.email),
    getRecentOrders(customerId),
  ]);

  const finalName = customerInfo
    ? `${customerInfo.first_name} ${customerInfo.last_name}`.trim() || customerInfo.username
    : decoded.name || decoded.email.split('@')[0];

  const memberSince = customerInfo?.date_created
    ? new Date(customerInfo.date_created).getFullYear()
    : '2025';

  return (
    <main className="account-main" dir="rtl">

      {/* Hero */}
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
              <span className="meta-pill">عضو {memberSince}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="account-grid">

        {/* Sidebar */}
        <aside className="account-sidebar">
          <nav className="side-nav">
            <Link href="/orders" className="nav-link">📦 طلباتي</Link>
            <Link href="/account/address" className="nav-link">📍 العناوين</Link>
            <LogoutButton />
          </nav>
        </aside>

        {/* Main */}
        <section className="account-body">

          {/* آخر الطلبات */}
          <div className="content-card">
            <div className="content-header">
              <h2>📦 آخر 3 طلبات</h2>
              <Link href="/orders" className="text-link">مشاهدة الكل</Link>
            </div>
            <div className="orders-stack">
              {recentOrders.length === 0 ? (
                <p className="empty-msg">لا توجد طلبات حالياً.</p>
              ) : (
                recentOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <div key={order.id} className="order-item-row">
                      <div className="order-main-info">
                        <span className="order-number">#{order.number || order.id}</span>
                        <span className="order-date">
                          {new Date(order.date_created).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <div
                        className="status-tag"
                        style={{
                          padding: '6px 16px',
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          minWidth: '110px',
                          textAlign: 'center',
                        }}
                      >
                        {statusInfo.label}
                      </div>
                      <div className="order-amount">{order.total} ر.س</div>
                      <Link href={`/orders/${order.id}`} className="order-action-btn">تتبع الطلب</Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Wishlist */}
          <WishlistSection />

        </section>
      </div>
    </main>
  );
}