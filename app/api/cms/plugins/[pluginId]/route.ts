/**
 * Single Plugin API
 *
 * CRUD operations for individual plugins
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ pluginId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { pluginId } = await params;

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
      include: {
        primitives: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            enabled: true,
          },
        },
        workflows: {
          select: {
            id: true,
            name: true,
            enabled: true,
          },
        },
      },
    });

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plugin });
  } catch (error) {
    console.error('Failed to fetch plugin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugin' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { pluginId } = await params;
    const body = await request.json();
    const { name, description, enabled, config } = body;

    const plugin = await prisma.plugin.update({
      where: { id: pluginId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
        ...(config && { config }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ plugin });
  } catch (error) {
    console.error('Failed to update plugin:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { pluginId } = await params;

    // Check if plugin is built-in
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    if (plugin.builtIn) {
      return NextResponse.json(
        { error: 'Cannot delete built-in plugins' },
        { status: 403 }
      );
    }

    // Delete plugin and its primitives
    await prisma.plugin.delete({
      where: { id: pluginId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete plugin:', error);
    return NextResponse.json(
      { error: 'Failed to delete plugin' },
      { status: 500 }
    );
  }
}
