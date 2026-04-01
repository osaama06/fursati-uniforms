import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import PasswordForm from './PasswordForm';

export const dynamic = 'force-dynamic';
export const metadata = { robots: 'noindex, nofollow' };

const secret = process.env.WT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987';

async function getCustomerData(email) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');
  try {
    const res = await fetch(`https://furssati.io/wp-json/wc/v3/customers?email=${email}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function PasswordPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    redirect('/login');
  }

  const customer = await getCustomerData(decoded.email);
  if (!customer) redirect('/account');

  return (
    <main dir="rtl" style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '30px' }}>🔒 تغيير كلمة المرور</h1>
      <PasswordForm customerId={customer.id} />
    </main>
  );
}