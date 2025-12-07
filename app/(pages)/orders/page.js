// app/(pages)/orders/page.js
import { Suspense } from 'react';
import OrdersPageContent from './OrdersPageContent';

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>جارٍ تحميل الطلبات...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}