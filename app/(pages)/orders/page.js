// app/(pages)/orders/page.js
import { Suspense } from 'react';
import OrdersPageContent from './OrdersPageContent';
import { getCurrentUser } from '@/lib/server-auth';
import { redirect } from 'next/navigation';

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>جارٍ تحميل الطلبات...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
