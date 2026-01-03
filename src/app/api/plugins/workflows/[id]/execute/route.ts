/**
 * Workflow Execute API Route
 *
 * POST /api/plugins/workflows/:id/execute - Execute a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeWorkflowInstance, triggerWorkflowManually } from '@/lib/workflows';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Execute workflow
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        workflowNodes: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Parse input from request body (for manual triggers)
    let input: Record<string, unknown> = {};
    try {
      const body = await request.json();
      input = body.input || {};
    } catch {
      // No body is fine for manual triggers
    }

    // Execute workflow using the workflow engine
    const result = await triggerWorkflowManually(workflow.id, input);

    return NextResponse.json({
      success: result.status === 'COMPLETED',
      executionId: result.executionId,
      result: result.result,
      error: result.error,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
