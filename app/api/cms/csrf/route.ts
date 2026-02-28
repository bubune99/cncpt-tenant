/**
 * CSRF Token API
 *
 * GET /api/csrf - Issue a fresh CSRF token (sets cookies + returns token in body)
 *
 * Clients should call this once on page load (or lazily before the first mutation)
 * and then include the token in the `x-csrf-token` header on all POST/PATCH/DELETE
 * requests to protected endpoints.
 */

import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/lib/cms/csrf';

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  setCsrfCookie(response, token);
  return response;
}
