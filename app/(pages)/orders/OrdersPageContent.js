'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStatusInfo, isHiddenFromCustomer } from './orderStatus';
export default function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/my-orders?t=${timestamp}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        // نخفي محاولات الدفع بالبطاقة اللي فشلت أو ما اكتملت
        setOrders((Array.isArray(data) ? data : []).filter((o) => !isHiddenFromCustomer(o)));
      } else {
        setError(data.error || 'فشل في جلب البيانات');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [isNew]);

  function OrdersSkeleton() {
    const skeletonItem = {
      background: 'linear-gradient(90deg, #f1f3f5 25%, #e9ecef 37%, #f1f3f5 63%)',
      backgroundSize: '400% 100%',
      animation: 'skeleton-loading 1.4s ease infinite',
      borderRadius: '10px'
    };

    return (
      <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', direction: 'rtl' }}>

        {/* هيدر وهمي */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ ...skeletonItem, width: '200px', height: '28px' }} />
          <div style={{ ...skeletonItem, width: '90px', height: '38px', borderRadius: '12px' }} />
        </div>

        {/* كروت وهمية */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '18px',
              border: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.2rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ ...skeletonItem, width: '120px', height: '40px' }} />
            <div style={{ ...skeletonItem, width: '110px', height: '30px' }} />
            <div style={{ ...skeletonItem, width: '80px', height: '30px' }} />
            <div style={{ ...skeletonItem, width: '140px', height: '40px', borderRadius: '12px' }} />
          </div>
        ))}

        {/* أنيميشن */}
        <style jsx>{`
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </main>
    );
  }

  if (loading) return <OrdersSkeleton />;

  return (
    <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', direction: 'rtl', fontFamily: 'inherit' }}>

      {/* الهيدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>📦 طلباتي ({orders.length})</h1>
        <button
          onClick={fetchOrders}
          style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', fontWeight: '600' }}
        >
          تحديث
        </button>
      </div>

      {/* قائمة الطلبات */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '15px' }}>
            <p style={{ color: '#666' }}>لا توجد طلبات سابقة في حسابك حالياً.</p>
            <Link href="/" style={{ color: '#00c2cb', fontWeight: 'bold', textDecoration: 'none' }}>ابدأ التسوق من هنا</Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);

            return (
              <div key={order.id} style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '18px',
                border: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                {/* رقم وتاريخ الطلب */}
                <div style={{ minWidth: '150px' }}>
                  <span style={{ fontWeight: '800', display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>#{order.number || order.id}</span>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>
                    {new Date(order.date_created).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                {/* حالة الطلب */}
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

                {/* السعر النهائي */}
                <div style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '1.1rem' }}>
                  {order.total} <span style={{ fontSize: '0.8rem' }}>ر.س</span>
                </div>

                {/* زر التفاصيل */}
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
                    transition: '0.2s',
                    border: '1px solid #e0f7f8'
                  }}
                >
                  تتبع الطلب
                </Link>
              </div>
            );
          })
        )}
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>⚠️ {error}</p>}
    </main>
  );
}