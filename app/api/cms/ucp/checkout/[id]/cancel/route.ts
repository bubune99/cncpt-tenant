/**
 * UCP Checkout — Cancel
 *
 * POST /api/ucp/checkout/:id/cancel — Cancel a checkout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUcpSession, updateUcpSession } from '@/lib/cms/ucp/sessions';
import { withTenant } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(_request, async () => {
  try {
    const { id } = await params;
    const session = getUcpSession(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed checkout session' },
        { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (session.status === 'canceled') {
      return NextResponse.json(
        { error: 'Checkout session is already canceled' },
        { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const updated = updateUcpSession(id, { status: 'canceled' });
    const response = updated || session;
    const { _created_at, _stripe_session_id, ...cleanResponse } = response;

    return NextResponse.json(
      { ...cleanResponse, status: 'canceled' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('[UCP Checkout] Cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel checkout session' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
  })
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, UCP-Agent',
    },
  });
}
