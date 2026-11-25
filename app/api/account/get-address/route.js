import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAppToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'غير مسجل' }, { status: 401 });

  const decoded = verifyAppToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });
  }

  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString('base64');

  try {
    const res = await fetch(`https://fursatiuniforms.store/wp-json/wc/v3/customers?email=${decoded.email}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!data || data.length === 0) return NextResponse.json({ billing: null });
    return NextResponse.json({ billing: data[0].billing });
  } catch {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}