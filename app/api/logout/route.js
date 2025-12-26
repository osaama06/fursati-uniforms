import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1. حذف التوكن من الكوكيز
  cookies().delete('token');

  // 2. الحصول على رابط الموقع (سواء كان لوكال أو دومين حقيقي)
  const baseURL = new URL(request.url).origin;

  // 3. التحويل لصفحة الدخول فوراً
  return NextResponse.redirect(`${baseURL}/login`);
}