import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { nodeId, nodeType, nodeData, previousOutputs } = await request.json();

    // Validate input
    if (!nodeId || !nodeType || !nodeData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock execution for now - in a real implementation, this would execute the actual node logic
    let result: any = {};

    switch (nodeType) {
      case 'action':
        // Simulate HTTP request action
        if (nodeData.actionType === 'http_request') {
          result = {
            status: 200,
            data: { message: 'HTTP request executed successfully', url: nodeData.url || 'https://api.example.com' },
            headers: { 'content-type': 'application/json' }
          };
        } else {
          result = { message: `Action ${nodeData.actionType} executed successfully` };
        }
        break;

      case 'typescript':
        // Execute TypeScript code (similar to existing test-node endpoint)
        try {
          // This is a simplified version - in production you'd want proper sandboxing
          const code = nodeData.code || '';
          if (code.trim()) {
            // Create a mock execution context
            const context = {
              event: previousOutputs.trigger || {},
              previous: previousOutputs,
              ...nodeData
            };
            
            // For safety, we'll just return a mock result
            result = {
              output: `Code executed successfully. Input context: ${JSON.stringify(context, null, 2)}`,
              executionTime: Date.now(),
              nodeId,
              nodeType
            };
          } else {
            result = { error: 'No code provided' };
          }
        } catch (error: any) {
          result = { error: error.message };
        }
        break;

      case 'slack':
        // Simulate Slack message
        result = {
          success: true,
          channel: nodeData.channel || '#general',
          message: nodeData.message || 'Hello from Flowless!',
          timestamp: Date.now(),
          messageId: `msg_${Date.now()}`
        };
        break;

      case 'whatsapp':
        // Simulate WhatsApp message
        result = {
          success: true,
          messageId: `wa_${Date.now()}`,
          status: 'sent',
          timestamp: Date.now()
        };
        break;

      case 'push_notification':
        // Simulate push notification
        result = {
          success: true,
          notificationId: `push_${Date.now()}`,
          status: 'delivered',
          timestamp: Date.now()
        };
        break;

      case 'condition':
        // Simulate condition evaluation
        result = {
          passed: Math.random() > 0.5, // Random result for demo
          evaluatedAt: Date.now(),
          condition: nodeData.condition || 'true'
        };
        break;

      default:
        result = { message: `Node type ${nodeType} executed successfully` };
    }

    // Add metadata
    const response = {
      success: true,
      output: result,
      nodeId,
      nodeType,
      executedAt: new Date().toISOString(),
      executionTime: Date.now()
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error running node:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to run node',
        nodeId: 'unknown',
        nodeType: 'unknown'
      },
      { status: 500 }
    );
  }
}
