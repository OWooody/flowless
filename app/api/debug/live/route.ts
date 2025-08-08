import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { addConnection, removeConnection } from '../../../lib/debug';

export async function GET(req: NextRequest) {
  try {
    const { userId: authUserId } = getAuth(req);
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID parameter is required' }, { status: 400 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store the controller for this connection
        const connectionId = `${authUserId}-${targetUserId}-${Date.now()}`;
        addConnection(connectionId, controller);
        
        console.log('Debug: New SSE connection established:', connectionId);

        // Send initial connection message
        const message = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to live request stream',
          targetUserId,
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(new TextEncoder().encode(message));

        // Clean up on close
        req.signal.addEventListener('abort', () => {
          removeConnection(connectionId);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 