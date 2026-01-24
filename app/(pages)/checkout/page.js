export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getCurrentUser } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/checkout');

  return <CheckoutClient user={user} />;
}