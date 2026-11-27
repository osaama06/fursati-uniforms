import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAppToken } from '@/lib/auth';
import { getCustomerByEmail } from '@/lib/getCustomerByEmail';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'غير مسجل' }, { status: 401 });

  const decoded = verifyAppToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });
  }

  try {
    const customer = await getCustomerByEmail(decoded.email);
    if (!customer) return NextResponse.json({ billing: null });
    return NextResponse.json({ billing: customer.billing ?? null });
  } catch {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}