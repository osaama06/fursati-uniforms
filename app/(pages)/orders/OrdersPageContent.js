'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const statusTranslations = {
  'pending': { label: 'بانتظار الدفع', color: '#f08c00', bg: '#fff9db' },
  'processing': { label: 'قيد التنفيذ', color: '#1c7ed6', bg: '#e7f5ff' },
  'on-hold': { label: 'قيد الانتظار', color: '#ae3ec9', bg: '#f8f0fc' },
  'completed': { label: 'مكتمل', color: '#0ca678', bg: '#e6fcf5' },
  'cancelled': { label: 'ملغي', color: '#e03131', bg: '#fff5f5' },
  'refunded': { label: 'مسترجع', color: '#748ffc', bg: '#edf2ff' },
  'failed': { label: 'فشل الطلب', color: '#fa5252', bg: '#fff5f5' },
  'checkout-draft': { label: 'مسودة', color: '#868e96', bg: '#f1f3f5' },
};

// مكون الهيكل العظمي (Skeleton Component)
const OrderSkeleton = () => (
  <div style={{
    background: '#fff', 
    padding: '1.5rem', 
    borderRadius: '18px', 
    border: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.2rem',
    animation: 'pulse 1.5s infinite ease-in-out'
  }}>
    <div style={{ width: '100px', height: '20px', background: '#f0f0f0', borderRadius: '4px' }}></div>
    <div style={{ width: '110px', height: '30px', background: '#f0f0f0', borderRadius: '10px' }}></div>
    <div style={{ width: '80px', height: '20px', background: '#f0f0f0', borderRadius: '4px' }}></div>
    <div style={{ width: '90px', height: '40px', background: '#f0f0f0', borderRadius: '10px' }}></div>
    <style>{`
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `}</style>
  </div>
);

export default function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';
  const isFetching = useRef(false);

  const fetchOrders = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/my-orders?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setOrders(data);
      else if (orders.length === 0) setError(data.error || 'فشل جلب الطلبات');
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => { fetchOrders(); }, [isNew]);

  return (
    <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', direction: 'rtl' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>📦 طلباتي</h1>
        <button 
          onClick={fetchOrders} 
          style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', fontWeight: '600' }}
        >
          🔄 تحديث
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* عرض الـ Skeleton أثناء التحميل */}
        {loading && orders.length === 0 ? (
          <>
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </>
        ) : orders.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '15px' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>لا توجد طلبات سابقة حالياً.</p>
            <Link href="/" style={{ color: '#00c2cb', fontWeight: 'bold', textDecoration: 'none' }}>تصفح المتجر من هنا</Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = statusTranslations[order.status] || { label: order.status, color: '#495057', bg: '#f1f3f5' };
            return (
              <div key={order.id} style={{
                background: '#fff', 
                padding: '1.5rem', 
                borderRadius: '18px', 
                border: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.2rem'
              }}>
                <div style={{ minWidth: '120px' }}>
                  <span style={{ fontWeight: '800', display: 'block', fontSize: '1.1rem' }}>#{order.id}</span>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>
                    {new Date(order.date_created).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <div style={{
                  padding: '6px 16px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.color,
                  minWidth: '110px',
                  textAlign: 'center'
                }}>
                  {statusInfo.label}
                </div>

                <div style={{ fontWeight: '800', color: '#1a1a1a' }}>
                  {order.total} <span style={{ fontSize: '0.8rem' }}>ر.س</span>
                </div>

                <Link 
                  href={`/orders/${order.id}`} 
                  style={{
                    textDecoration: 'none',
                    color: '#00c2cb',
                    background: '#f0fbfc',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    border: '1px solid #e0f7f8'
                  }}
                >
                  التفاصيل
                </Link>
              </div>
            )
          })
        )}
      </div>

      {error && orders.length === 0 && (
        <p style={{ color: '#e03131', textAlign: 'center', marginTop: '2rem', padding: '1rem', background: '#fff5f5', borderRadius: '10px' }}>
          ⚠️ {error}
        </p>
      )}
    </main>
  );
}