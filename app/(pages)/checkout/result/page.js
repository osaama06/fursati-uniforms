// app/(pages)/checkout/result/page.js
import { Suspense } from 'react';
import PaymentResultClient from './PaymentResultClient';

// الصفحة تعتمد على query params ونتيجة الدفع — ما تنفع static
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'نتيجة الدفع | فرصتي',
  robots: { index: false, follow: false },
};

export default function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultClient />
    </Suspense>
  );
}