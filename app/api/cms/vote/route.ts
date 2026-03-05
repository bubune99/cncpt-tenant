import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/cms/api/tenant';

// Stub vote endpoint to prevent 404s from ChatSDK message actions
export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  const chatId = request.nextUrl.searchParams.get('chatId');
  if (!chatId) {
    return NextResponse.json([], { status: 200 });
  }
  // Return empty votes array — voting not implemented
  return NextResponse.json([], { status: 200 });
  })
}

export async function PATCH(request: NextRequest) {
  return withTenant(request, async () => {
  // Accept vote requests silently — voting not implemented
  return NextResponse.json({ success: true }, { status: 200 });
  })
}
