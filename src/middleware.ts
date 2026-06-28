import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

const authMiddleware = auth.middleware({
  loginUrl: '/auth/sign-in',
});

export default function middleware(request: NextRequest) {
  // Server Actions tunnel through normal page routes with a `Next-Action`
  // header. They authenticate themselves inside the action body, so let them
  // through without an extra round-trip to the auth server.
  if (request.headers.has('Next-Action')) {
    return;
  }
  return authMiddleware(request);
}

export const config = {
  matcher: ['/', '/history', '/account/:path*'],
};
