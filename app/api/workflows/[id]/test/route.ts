import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { workflowService } from '../../../../lib/workflow';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if workflow exists and user has access
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

    const body = await req.json();
    const { testEvent } = body;

    // Use provided test event or create a default one
    const trigger = workflow.trigger as any;
    const eventData = testEvent || {
      name: 'test_event',
      category: trigger?.eventType || 'engagement',
      itemName: 'test_item',
      itemCategory: 'test_category',
      value: 100,
      userId: session.userId,
      organizationId: session.orgId,
      timestamp: new Date().toISOString(),
    };

    // Execute the workflow with test data
    const result = await workflowService.executeWorkflow(params.id, eventData);

    return NextResponse.json({
      success: true,
      result,
      testEvent: eventData,
    });
  } catch (error) {
    console.error('Error testing workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 