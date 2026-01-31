/**
 * Single Workflow API Routes
 *
 * GET    /api/plugins/workflows/:id - Get workflow details
 * PATCH  /api/plugins/workflows/:id - Update workflow
 * DELETE /api/plugins/workflows/:id - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single workflow
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        _count: {
          select: { executions: true },
        },
        template: {
          select: { id: true, name: true, category: true },
        },
        executions: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            error: true,
          },
        },
        steps: {
          orderBy: { order: 'asc' },
        },
        logs: {
          take: 50,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Get workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow' },
      { status: 500 }
    );
  }
}

// PATCH - Update workflow
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if workflow exists
    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Extract updatable fields
    const {
      name,
      description,
      enabled,
      triggerType,
      triggerConfig,
      nodes,
      edges,
      viewport,
      config,
      variables,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (triggerType !== undefined) updateData.triggerType = triggerType;
    if (triggerConfig !== undefined) updateData.triggerConfig = triggerConfig;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (viewport !== undefined) updateData.viewport = viewport;
    if (config !== undefined) updateData.config = config;
    if (variables !== undefined) updateData.variables = variables;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE - Delete workflow
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if workflow exists
    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Delete workflow and all related data (cascades via Prisma)
    await prisma.workflow.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
