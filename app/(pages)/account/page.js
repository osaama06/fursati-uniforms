import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Image from 'next/image';
import Link from 'next/link';
import '@/styles/pages/account.css';
import { redirect } from 'next/navigation';

const secret = process.env.JWT_SECRET;

export default async function AccountPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userData;

  try {
    userData = jwt.verify(token, secret);
  } catch (error) {
    redirect('/login');
  }

  return (
    <main className="account-container">

      <section className="profile-section">
        <Image
          src="/osama.png"
          alt="Profile"
          width={120}
          height={120}
          className="profile-image"
        />
        <h1>{userData.name || userData.username}</h1>
        <p>{userData.email}</p>
      </section>

      <section className="details-section">
        <h2>معلومات الحساب</h2>
      </section>

      <section className="orders-section">
        <h2>
          <Link href={`/orders`}>الطلبات الأخيرة</Link>
        </h2>
        <p>لا توجد طلبات حالياً</p>
      </section>

    </main>
  );
}





