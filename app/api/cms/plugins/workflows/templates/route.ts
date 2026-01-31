/**
 * Workflow Templates API Routes
 *
 * GET  /api/plugins/workflows/templates - List available templates
 * POST /api/plugins/workflows/templates - Install a template (create workflow from it)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';

export const dynamic = 'force-dynamic'

// GET - List workflow templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.workflowTemplate.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { workflows: true },
        },
      },
    });

    // Group by category for easier UI rendering
    const byCategory = templates.reduce((acc, template) => {
      const cat = template.category || 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    return NextResponse.json({
      templates,
      byCategory,
      total: templates.length,
    });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// POST - Install template (create workflow from template)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, name, customConfig } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Generate name and slug
    const workflowName = name || `${template.name} Copy`;
    const baseSlug = workflowName
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

    // Merge template config with custom config
    const config = {
      ...(customConfig || {}),
    };

    // Convert template steps to React Flow nodes/edges
    // Templates store simplified steps, we convert to full React Flow format
    const steps = template.steps as Array<{ id: string; type: string; config: Record<string, unknown> }> || [];
    const nodes = steps.map((step, index) => ({
      id: step.id || `step-${index}`,
      type: step.type || 'primitive',
      position: { x: 250, y: 100 + index * 150 },
      data: step.config || {},
    }));

    // Create edges connecting steps sequentially
    const edges = steps.slice(0, -1).map((step, index) => ({
      id: `edge-${index}`,
      source: step.id || `step-${index}`,
      target: steps[index + 1]?.id || `step-${index + 1}`,
      type: 'smoothstep',
    }));

    // Create workflow from template
    const workflow = await prisma.workflow.create({
      data: {
        name: workflowName,
        slug,
        description: template.description,
        triggerType: template.trigger,
        triggerConfig: (template.triggerConfig ?? {}) as never,
        nodes: nodes as never,
        edges: edges as never,
        config: config as never,
        templateId: template.id,
        enabled: false,
      },
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
      success: true,
      workflow,
      message: `Workflow "${workflowName}" created from template "${template.name}"`,
    }, { status: 201 });
  } catch (error) {
    console.error('Install template error:', error);
    return NextResponse.json(
      { error: 'Failed to install template' },
      { status: 500 }
    );
  }
}
