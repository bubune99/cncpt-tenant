/**
 * MCP Server Individual API
 *
 * GET    /api/mcp/servers/[id] - Get a specific server
 * PATCH  /api/mcp/servers/[id] - Update a server
 * DELETE /api/mcp/servers/[id] - Delete a server
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '../../../../../lib/stack';
import { prisma } from '../../../../../lib/db';
import { encrypt } from '../../../../../lib/encryption';
import { invalidateMcpServerCache } from '../../../../../lib/mcp';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const server = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('[MCP Server] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP server' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if server exists
    const existing = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const body = await request.json();

    // Check if name is being changed to one that already exists
    if (body.name && body.name !== existing.name) {
      const nameConflict = await prisma.mcpServer.findUnique({
        where: { name: body.name },
      });
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Server with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.displayName !== undefined) updateData.displayName = body.displayName || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.command !== undefined) updateData.command = body.command;
    if (body.args !== undefined) updateData.args = body.args;
    if (body.env !== undefined) updateData.env = body.env;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;

    // Handle encrypted env vars
    if (body.envSecrets !== undefined) {
      if (body.envSecrets && Object.keys(body.envSecrets).length > 0) {
        updateData.envEncrypted = encrypt(JSON.stringify(body.envSecrets));
      } else {
        updateData.envEncrypted = null;
      }
    }

    const server = await prisma.mcpServer.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache for this server so it reconnects with new config
    await invalidateMcpServerCache(existing.name);
    if (body.name && body.name !== existing.name) {
      await invalidateMcpServerCache(body.name);
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('[MCP Server] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update MCP server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if server exists
    const existing = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Invalidate cache before deleting
    await invalidateMcpServerCache(existing.name);

    // Delete the server
    await prisma.mcpServer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MCP Server] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete MCP server' },
      { status: 500 }
    );
  }
}
