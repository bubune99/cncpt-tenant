/**
 * Plugin UI API
 *
 * Store and retrieve Puck UI data for plugins
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'settings';

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // UI data is stored in plugin config
    const uiData = (plugin.config as Record<string, unknown>)?.[`ui_${type}`];

    return NextResponse.json({
      ui: uiData
        ? {
            type,
            data: uiData,
            updatedAt: plugin.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to fetch plugin UI:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugin UI' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { pluginId } = await params;
    const body = await request.json();
    const { type = 'settings', data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'UI data is required' },
        { status: 400 }
      );
    }

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // Store UI data in plugin config
    const existingConfig = (plugin.config as Record<string, unknown>) || {};
    const updatedConfig = {
      ...existingConfig,
      [`ui_${type}`]: data,
    };

    const updatedPlugin = await prisma.plugin.update({
      where: { id: pluginId },
      data: {
        config: updatedConfig,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      plugin: updatedPlugin,
    });
  } catch (error) {
    console.error('Failed to save plugin UI:', error);
    return NextResponse.json(
      { error: 'Failed to save plugin UI' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { pluginId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'settings';

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // Remove UI data from plugin config
    const existingConfig = (plugin.config as Record<string, unknown>) || {};
    const { [`ui_${type}`]: removed, ...remainingConfig } = existingConfig;

    await prisma.plugin.update({
      where: { id: pluginId },
      data: {
        config: remainingConfig as object,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete plugin UI:', error);
    return NextResponse.json(
      { error: 'Failed to delete plugin UI' },
      { status: 500 }
    );
  }
}
