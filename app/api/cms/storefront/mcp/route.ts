/**
 * Storefront MCP Endpoint
 *
 * Public MCP server endpoint for AI shopping agents.
 * Implements MCP Streamable HTTP transport (stateless mode).
 *
 * POST /api/storefront/mcp — JSON-RPC messages (tool calls, initialize, etc.)
 * GET  /api/storefront/mcp — SSE stream for server-sent notifications
 * DELETE /api/storefront/mcp — Session teardown (no-op in stateless mode)
 *
 * All tools are public — no authentication required.
 * AI agents can discover this endpoint via the UCP profile at /.well-known/ucp.
 */

import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createStorefrontServer } from '@/lib/cms/mcp/storefront-server';

export const dynamic = 'force-dynamic';

/**
 * Handle MCP requests in stateless mode.
 * Each request creates a fresh server+transport pair.
 */
async function handleMcpRequest(req: NextRequest): Promise<Response> {
  const server = createStorefrontServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    // Clean up after request
    await transport.close();
    await server.close();
  }
}

// MCP JSON-RPC messages
export async function POST(req: NextRequest): Promise<Response> {
  const response = await handleMcpRequest(req);

  // Add CORS headers
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// MCP SSE stream (for server-sent notifications)
export async function GET(req: NextRequest): Promise<Response> {
  const response = await handleMcpRequest(req);

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// MCP session teardown
export async function DELETE(req: NextRequest): Promise<Response> {
  const response = await handleMcpRequest(req);

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version, MCP-Session-Id',
    },
  });
}
