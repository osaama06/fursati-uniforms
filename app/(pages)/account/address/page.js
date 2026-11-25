import { cookies } from 'next/headers';
import { verifyAppToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AddressForm from './AddressForm';

export const dynamic = 'force-dynamic';
export const metadata = { robots: 'noindex, nofollow' };

async function getCustomerData(email) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');
  try {
    const res = await fetch(`https://fursatiuniforms.store/wp-json/wc/v3/customers?email=${email}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function AddressPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const decoded = verifyAppToken(token);
  if (!decoded) redirect('/login');

  const customer = await getCustomerData(decoded.email);
  if (!customer) redirect('/account');

  return <AddressForm customerId={customer.id} billing={customer.billing} />;
}