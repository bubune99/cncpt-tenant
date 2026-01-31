import type { NextRequest } from "next/server";

// Catch-all route for Puck API endpoints
// Forwards requests to the appropriate handler

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  const path = all.join("/");

  // Handle chat requests
  if (path === "chat" || path.startsWith("chat/")) {
    const chatUrl = new URL("/api/puck/chat", request.url);
    const body = await request.text();

    return fetch(chatUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
      },
      body,
    });
  }

  // Return 404 for unknown endpoints
  return new Response(
    JSON.stringify({ error: `Unknown Puck API endpoint: ${path}` }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params;
  const path = all.join("/");

  return new Response(`Puck API endpoint: ${path}`, { status: 200 });
}
