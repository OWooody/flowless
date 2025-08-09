import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { workflowService } from '@/lib/workflow';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up orphaned running steps
    await workflowService.cleanupOrphanedRunningSteps();

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
