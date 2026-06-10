import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protect root page: require authentication to open project root
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const payloadRaw = parts[1];
      const base64 = payloadRaw.replace(/-/g, '+').replace(/_/g, '/');
      const payloadDecoded = atob(base64);
      const payload = JSON.parse(payloadDecoded);
      const role = payload.role;

      if (role) {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Safe base64url decoding compatible with Next.js Edge runtime (atob)
      const payloadRaw = parts[1];
      const base64 = payloadRaw.replace(/-/g, '+').replace(/_/g, '/');
      const payloadDecoded = atob(base64);
      const payload = JSON.parse(payloadDecoded);
      const role = payload.role;

      if (!role) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check access permission based on role
      if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
      if (pathname.startsWith('/dashboard/volunteer') && role !== 'VOLUNTEER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
      if (pathname.startsWith('/dashboard/user') && role !== 'USER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users trying to access login/register
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadRaw = parts[1];
          const base64 = payloadRaw.replace(/-/g, '+').replace(/_/g, '/');
          const payloadDecoded = atob(base64);
          const payload = JSON.parse(payloadDecoded);
          const role = payload.role;
          if (role) {
            return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, request.url));
          }
        }
      } catch (e) {
        // Ignore and allow login page access if token is invalid
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/register'],
};
