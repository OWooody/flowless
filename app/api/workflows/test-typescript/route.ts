import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { TypeScriptExecutor } from '@/lib/typescript-executor';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, context = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const executor = new TypeScriptExecutor();

    // Validate syntax first
    const validation = executor.validateSyntax(code);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create enhanced context for testing with generic data
    const testContext = {
      input: context.input || {
        // Generic input data - can be anything
        type: 'data_processing',
        data: { 
          items: [
            { id: 1, name: 'Item 1', value: 100 },
            { id: 2, name: 'Item 2', value: 200 },
            { id: 3, name: 'Item 3', value: 150 }
          ],
          metadata: {
            source: 'test',
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      },
      workflow: context.workflow || {
        id: 'test-workflow',
        name: 'Generic Data Processing Workflow',
        variables: { 
          processingMode: 'batch',
          maxItems: 1000,
          outputFormat: 'json'
        }
      },
      previous: context.previous || {
        // Simulate previous node output - generic data
        processedCount: 3,
        totalValue: 450,
        status: 'ready_for_next_step',
        timestamp: new Date().toISOString()
      },
      nodeId: 'test-node',
      nodeType: 'typescript',
      console: {
        log: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args),
      },
    };

    // Execute the code
    const result = await executor.execute(code, testContext);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing TypeScript code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}
