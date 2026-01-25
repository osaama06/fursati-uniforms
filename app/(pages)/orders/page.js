import { getCurrentUser } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import OrdersPageContent from './OrdersPageContent';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login?redirect=/orders');
  }

  return (
    <Suspense >
      <OrdersPageContent />
    </Suspense>
  );
}