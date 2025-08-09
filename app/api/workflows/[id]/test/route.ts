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
    const { testData } = body;

    // Require test data from user
    if (!testData) {
      return NextResponse.json(
        { error: 'Test data is required' },
        { status: 400 }
      );
    }

    // Execute the workflow with provided test data
    const result = await workflowService.executeWorkflow(params.id, testData);

    return NextResponse.json({
      success: true,
      result,
      testData: testData,
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