import type { NextRequest } from "next/server";

// Main Puck API endpoint - redirects to appropriate handler
export async function POST(request: NextRequest) {
  // Forward to chat endpoint
  const chatUrl = new URL("/api/puck/chat", request.url);
  return fetch(chatUrl.toString(), {
    method: "POST",
    headers: request.headers,
    body: await request.text(),
  });
}

export async function GET() {
  return new Response("Puck AI endpoint is ready (using Anthropic)", { status: 200 });
}
