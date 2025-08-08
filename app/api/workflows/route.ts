import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TriggerConfig, ActionConfig } from '../../lib/workflow';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = session.orgId;

    const workflows = await prisma.workflow.findMany({
      where: {
        organizationId: organizationId || null,
        userId: session.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, trigger, actions, edges } = body;

    // Debug: Log the received data
    console.log('Received workflow data:', JSON.stringify(body, null, 2));

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      console.log('Validation failed:', { name, trigger, actions });
      return NextResponse.json(
        { error: 'Invalid workflow configuration' },
        { status: 400 }
      );
    }

    // Validate trigger configuration - only require basic trigger structure
    if (!trigger || typeof trigger !== 'object') {
      return NextResponse.json(
        { error: 'Trigger configuration is required' },
        { status: 400 }
      );
    }

        // Validate actions
    for (const action of actions) {
      if (!action.type) {
        return NextResponse.json(
          { error: 'Action type is required' },
          { status: 400 }
        );
      }

      // Handle different action types
      if (action.type === 'push_notification') {
        if (!action.title || !action.body) {
          return NextResponse.json(
            { error: 'Push notification actions require title and body' },
            { status: 400 }
          );
        }

        if (!action.targetUsers) {
          return NextResponse.json(
            { error: 'Target users configuration is required' },
            { status: 400 }
          );
        }
      } else if (action.type === 'action' || action.type === 'typescript' || action.type === 'condition') {
        // These are the new generic action types - no specific validation needed
        continue;
      }
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        trigger: trigger as TriggerConfig,
        actions: actions as ActionConfig[],
        edges: edges || null,
        organizationId: session.orgId || null,
        userId: session.userId,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 