import { cookies } from 'next/headers';
import { verifyAppToken } from './auth';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return await verifyAppToken(token);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
