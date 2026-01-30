/**
 * Workflow API Routes
 *
 * GET  /api/plugins/workflows - List all workflows
 * POST /api/plugins/workflows - Create a new workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

// GET - List all workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    const triggerType = searchParams.get('triggerType');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (enabled !== null) {
      where.enabled = enabled === 'true';
    }

    if (triggerType) {
      where.triggerType = triggerType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { executions: true },
        },
        template: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      workflows,
      total: workflows.length,
    });
  } catch (error) {
    console.error('List workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

// POST - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      triggerType = 'MANUAL',
      triggerConfig,
      nodes = [],
      edges = [],
      config,
      variables,
      templateId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.workflow.findFirst({ where: { slug, tenantId: null } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        slug,
        description,
        triggerType,
        triggerConfig,
        nodes,
        edges,
        config,
        variables,
        templateId,
        enabled: false,
      },
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
