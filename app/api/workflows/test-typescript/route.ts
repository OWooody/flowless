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

    // Execute the code
    const result = await executor.execute(code, {
      event: context.event || {},
      workflow: context.workflow || {},
      previous: context.previous || {},
      console: {
        log: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing TypeScript code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}
