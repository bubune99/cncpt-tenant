/**
 * MCP Server Status API
 *
 * GET /api/mcp/status - Get status of all configured MCP servers
 */

import { NextResponse } from 'next/server';
import { stackServerApp } from '../../../../lib/stack';
import { prisma } from '../../../../lib/db';
import { getMcpServerStatus, loadMcpConfig } from '../../../../lib/mcp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in database
    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Get MCP configuration (merged from file + database)
    const config = await loadMcpConfig();
    if (!config) {
      return NextResponse.json({
        configured: false,
        servers: [],
        message: 'No MCP servers configured (check .mcp.json or add via API)',
      });
    }

    // Get server status
    const status = await getMcpServerStatus();

    // Count sources
    const fileServers = status.filter((s) => s.source === 'file').length;
    const dbServers = status.filter((s) => s.source === 'database').length;

    return NextResponse.json({
      configured: true,
      servers: status,
      totalServers: Object.keys(config.mcpServers).length,
      connectedServers: status.filter((s) => s.connected).length,
      totalTools: status.reduce((sum, s) => sum + s.toolCount, 0),
      sources: {
        file: fileServers,
        database: dbServers,
      },
    });
  } catch (error) {
    console.error('[MCP Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get MCP status' },
      { status: 500 }
    );
  }
}
