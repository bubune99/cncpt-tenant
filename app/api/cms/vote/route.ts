import { NextRequest, NextResponse } from 'next/server';

// Stub vote endpoint to prevent 404s from ChatSDK message actions
export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get('chatId');
  if (!chatId) {
    return NextResponse.json([], { status: 200 });
  }
  // Return empty votes array — voting not implemented
  return NextResponse.json([], { status: 200 });
}

export async function PATCH() {
  // Accept vote requests silently — voting not implemented
  return NextResponse.json({ success: true }, { status: 200 });
}
