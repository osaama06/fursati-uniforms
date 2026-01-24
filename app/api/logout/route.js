import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1. حذف التوكن من الكوكيز — تأكد من انتظار استدعاء cookies() في Next.js 15
  const cookieStore = await cookies();
  // مسح مع خصائص متوافقة مع ما تم تعيينه
  cookieStore.delete('token', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });

  // 2. الحصول على رابط الموقع (سواء كان لوكال أو دومين حقيقي)
  const baseURL = new URL(request.url).origin;

  // 3. التحويل لصفحة الدخول فوراً
  return NextResponse.redirect(`${baseURL}/login`);
}