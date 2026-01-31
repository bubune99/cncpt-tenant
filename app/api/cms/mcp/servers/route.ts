/**
 * MCP Servers Management API
 *
 * GET  /api/mcp/servers - List all MCP servers from database
 * POST /api/mcp/servers - Create a new MCP server configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '../../../../lib/stack';
import { prisma } from '../../../../lib/db';
import { encrypt } from '../../../../lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all MCP servers from database
    const servers = await prisma.mcpServer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Don't return encrypted values directly
    const sanitizedServers = servers.map((server) => ({
      id: server.id,
      name: server.name,
      displayName: server.displayName,
      description: server.description,
      command: server.command,
      args: server.args,
      env: server.env, // Plain env vars are fine
      hasEncryptedEnv: !!server.envEncrypted,
      enabled: server.enabled,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
    }));

    return NextResponse.json({ servers: sanitizedServers });
  } catch (error) {
    console.error('[MCP Servers] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.command) {
      return NextResponse.json(
        { error: 'Name and command are required' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await prisma.mcpServer.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Server with this name already exists' },
        { status: 409 }
      );
    }

    // Encrypt sensitive env vars if provided
    let envEncrypted: string | null = null;
    if (body.envSecrets && Object.keys(body.envSecrets).length > 0) {
      envEncrypted = encrypt(JSON.stringify(body.envSecrets));
    }

    // Create the server
    const server = await prisma.mcpServer.create({
      data: {
        name: body.name,
        displayName: body.displayName || null,
        description: body.description || null,
        command: body.command,
        args: body.args || [],
        env: body.env || null,
        envEncrypted,
        enabled: body.enabled ?? true,
      },
    });

    return NextResponse.json(
      {
        server: {
          id: server.id,
          name: server.name,
          displayName: server.displayName,
          description: server.description,
          command: server.command,
          args: server.args,
          env: server.env,
          hasEncryptedEnv: !!server.envEncrypted,
          enabled: server.enabled,
          createdAt: server.createdAt,
          updatedAt: server.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[MCP Servers] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create MCP server' },
      { status: 500 }
    );
  }
}
