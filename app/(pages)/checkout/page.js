import { getCurrentUser } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const CheckoutClient = dynamic(() => import('./CheckoutClient'), { ssr: false });

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/checkout');

  return <CheckoutClient />;
}