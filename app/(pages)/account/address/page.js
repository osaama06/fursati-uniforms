import { cookies } from 'next/headers';
import { verifyAppToken } from '@/lib/auth';
import { getCustomerByEmail } from '@/lib/getCustomerByEmail';
import { redirect } from 'next/navigation';
import AddressForm from './AddressForm';

export const dynamic = 'force-dynamic';
export const metadata = { robots: 'noindex, nofollow' };

// ما لقيناه → redirect('/account') تحت، فأي فشل يرجّع null
async function getCustomerData(email) {
  try {
    return await getCustomerByEmail(email);
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