/**
 * Next.js Middleware
 *
 * Handles authentication for protected routes.
 * Protected areas: /admin/*, /dashboard/*, /app/*
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/app',
  '/editor',
];

// Public routes within protected areas (like auth callbacks)
const PUBLIC_ROUTES = [
  '/handler',
  '/api/auth',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  '/handler/sign-in',
  '/handler/sign-up',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route requires protection
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for Stack Auth session cookie
  // Stack Auth uses cookies prefixed with 'stack-'
  const hasAuthCookie = request.cookies.has('stack-refresh-') ||
                        Array.from(request.cookies.getAll()).some(c => c.name.startsWith('stack-'));

  if (!hasAuthCookie) {
    // Redirect to sign in with return URL
    const signInUrl = new URL('/handler/sign-in', request.url);
    signInUrl.searchParams.set('after_auth_return_to', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // User has auth cookie, let the request through
  // Actual permission checks happen at the page/API level
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
