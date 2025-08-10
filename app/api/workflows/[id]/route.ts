import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TriggerConfig, ActionConfig } from '../../../lib/workflow';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        organizationId: session.orgId || null,
        userId: session.userId,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, trigger, actions, edges, isActive } = body;

    // Check if workflow exists and user has access
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        organizationId: session.orgId || null,
        userId: session.userId,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Validate input if provided - generic validation
    if (trigger && (typeof trigger !== 'object' || trigger === null)) {
      return NextResponse.json(
        { error: 'Invalid trigger configuration' },
        { status: 400 }
      );
    }

    if (actions && Array.isArray(actions)) {
      for (const action of actions) {
        if (!action.type) {
          return NextResponse.json(
            { error: 'Action type is required' },
            { status: 400 }
          );
        }

        // Handle different action types
        if (action.type === 'action' || action.type === 'typescript' || action.type === 'condition' || action.type === 'slack') {
          // These are the new generic action types - no specific validation needed
          continue;
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger as TriggerConfig;
    if (actions !== undefined) updateData.actions = actions as ActionConfig[];
    if (edges !== undefined) updateData.edges = edges;
    if (isActive !== undefined) updateData.isActive = isActive;

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if workflow exists and user has access
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        organizationId: session.orgId || null,
        userId: session.userId,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Delete workflow executions first
    await prisma.workflowExecution.deleteMany({
      where: { workflowId: params.id },
    });

    // Delete workflow
    await prisma.workflow.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
} 