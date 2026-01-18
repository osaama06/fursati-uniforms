// app/(pages)/orders/OrdersPageContent.js
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderCard from '@/app/components/ordercard/page';

export default function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-orders?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      console.log('الطلبات من API:', data);
      if (res.ok) {
        setOrders(data);
      } else {
        console.error(data.error || 'حدث خطأ ما');
      }
    } catch (err) {
      console.error('فشل في جلب الطلبات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isNew]);

  if (loading) return <p style={{ textAlign: 'center' }}>جارٍ تحميل الطلبات...</p>;

  if (!orders.length) {
    return <p style={{ textAlign: 'center' }}>لا توجد طلبات حالياً</p>;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>طلباتي</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ul>
    </main>
  );
}