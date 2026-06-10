import { verifyToken } from './jwt';
import { cookies } from 'next/headers';

export function getAuthUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenCookie = cookieHeader.split(';').find((c) => c.trim().startsWith('token='));
  const token = tokenCookie ? tokenCookie.trim().slice('token='.length) : null;

  if (!token) return null;
  return verifyToken(token);
}

// Server-side helper for Next.js app directory server components
export async function getAuthUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || null;
  if (!token) return null;
  return verifyToken(token);
}
