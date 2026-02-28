/**
 * CSRF Protection — Double-Submit Cookie Pattern
 *
 * How it works:
 * 1. Server generates a random token and sets it as an httpOnly cookie (`csrf_token`).
 * 2. Client reads a matching non-httpOnly cookie (`csrf_token_client`) and sends
 *    it back in the `x-csrf-token` header (or `_csrf` body field) on mutations.
 * 3. Server compares the cookie value with the header/body value — if they match,
 *    the request originated from code that could read the cookie (same origin).
 *
 * This works well with Next.js because:
 * - No server-side session storage needed
 * - Compatible with static generation and client-side fetching
 * - Cookies are sent automatically; JS just needs to copy the value to a header
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_BODY_FIELD = '_csrf';

// ---------------------------------------------------------------------------
// Token generation
// ---------------------------------------------------------------------------

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

// ---------------------------------------------------------------------------
// Set CSRF cookie on a response
// ---------------------------------------------------------------------------

/**
 * Attach CSRF token cookies to a response. Call this when rendering forms
 * or when the client requests a fresh token (e.g. GET /api/csrf).
 */
export function setCsrfCookie(response: NextResponse, token?: string): string {
  const csrfToken = token ?? generateCsrfToken();

  // httpOnly cookie — the authoritative copy
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  });

  // Readable cookie — client JS reads this and puts it in a header
  response.cookies.set(`${CSRF_COOKIE}_client`, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4,
  });

  return csrfToken;
}

// ---------------------------------------------------------------------------
// Validate CSRF on incoming mutation requests
// ---------------------------------------------------------------------------

/**
 * Validate CSRF token on a mutation request.
 *
 * Returns `null` if valid, or a `NextResponse` (403) if invalid.
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const csrfError = validateCsrf(request);
 *   if (csrfError) return csrfError;
 *   // ... rest of handler
 * }
 * ```
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  // Allow the token in a body field as a fallback for traditional form posts.
  // We cannot read the body here without consuming it, so we only check the
  // header. Forms should use hidden input + fetch with the header set.
  const submittedToken = headerToken;

  if (!cookieToken || !submittedToken) {
    return NextResponse.json(
      { error: 'Missing CSRF token' },
      { status: 403 },
    );
  }

  // Constant-time comparison to avoid timing attacks
  if (!timingSafeEqual(cookieToken, submittedToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 },
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Constant-time string comparison
// ---------------------------------------------------------------------------

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return cryptoTimingSafeEqual(bufA, bufB);
}
