// app/(pages)/orders/OrdersPageContent.js
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderCard from '@/app/components/ordercard/page';

export default function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      // ✅ timestamp فريد لكل طلب
      const timestamp = Date.now() + Math.random();

      // ✅ جلب Token من localStorage
      const token = localStorage.getItem('token');

      const res = await fetch(`/api/my-orders?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await res.json();
      console.log(`📦 تم جلب ${data.length} طلب`);

      if (res.ok) {
        setOrders(data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'حدث خطأ ما');
      }
    } catch (err) {
      console.error('❌ فشل:', err);
      setError('فشل في جلب الطلبات');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isNew]);

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <p style={{ textAlign: 'center' }}>⏳ جارٍ تحميل الطلبات...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '2rem' }}>
        <p style={{ textAlign: 'center', color: 'red' }}>⚠️ {error}</p>
        <button
          onClick={() => fetchOrders()}
          style={{
            display: 'block',
            margin: '1rem auto',
            padding: '0.7rem 1.5rem',
            cursor: 'pointer',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          🔄 إعادة المحاولة
        </button>
      </main>
    );
  }

  if (!orders.length) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1 style={{ textAlign: 'center' }}>طلباتي</h1>
        <p style={{ textAlign: 'center' }}>📭 لا توجد طلبات حالياً</p>
        <button
          onClick={() => fetchOrders()}
          style={{
            display: 'block',
            margin: '2rem auto',
            padding: '0.7rem 1.5rem',
            cursor: 'pointer',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          🔄 تحديث
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ margin: 0 }}>
          📦 طلباتي ({orders.length})
        </h1>

        <button
          onClick={() => fetchOrders()}
          style={{
            padding: '0.7rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔄 تحديث الطلبات
        </button>
      </div>

      <p style={{
        textAlign: 'center',
        color: '#666',
        fontSize: '0.9rem',
        marginBottom: '1rem'
      }}>
        آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
      </p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ul>
    </main>
  );
}