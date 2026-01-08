// app/(pages)/orders/page.js
import { Suspense } from 'react';
import OrdersPageContent from './OrdersPageContent';
import { getCurrentUser } from '@/lib/server-auth';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/orders');

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>جارٍ تحميل الطلبات...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}