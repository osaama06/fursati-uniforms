// lib/server-auth.js
import { cookies } from 'next/headers';
import { verifyAppToken } from './auth';

/**
 * الحصول على المستخدم الحالي
 */
export async function getCurrentUser() {  // ✅ async
  try {
    const cookieStore = await cookies(); // ✅ await
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    return verifyAppToken(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * التحقق من تسجيل الدخول
 */
export async function requireAuth() {  // ✅ async
  const user = await getCurrentUser(); // ✅ await
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}