import { NextRequest, NextResponse } from 'next/server';
import { TypeScriptExecutor } from '@/lib/typescript-executor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodeId, nodeType, nodeData, previousOutputs } = body;

    console.log('Testing node:', { nodeId, nodeType, nodeData, previousOutputs });

    if (nodeType === 'typescript') {
      // Execute TypeScript code
      const executor = new TypeScriptExecutor();
      
      // Create context with previous outputs
      const context = {
        input: { message: "Test input data" },
        workflow: {},
        previous: previousOutputs, // This contains all previous node outputs
        console: {
          log: console.log,
          error: console.error,
          warn: console.warn,
        },
      };

      const result = await executor.execute(nodeData.code || '', context);
      
      return NextResponse.json({
        success: true,
        output: result.output,
        logs: result.logs,
        executionTime: result.executionTime
      });
    }

    if (nodeType === 'action') {
      // Handle action nodes (HTTP requests, etc.)
      let output = {};
      
      if (nodeData.actionType === 'http_request') {
        try {
          const response = await fetch(nodeData.url || '', {
            method: nodeData.method || 'GET',
            headers: nodeData.headers ? JSON.parse(nodeData.headers) : {},
            body: nodeData.body ? JSON.parse(nodeData.body) : undefined,
          });
          
          const responseData = await response.json();
          output = {
            status: response.status,
            data: responseData,
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `HTTP request failed: ${error}`
          });
        }
      }

      if (nodeData.actionType === 'data_processing') {
        // Execute JavaScript processing script
        try {
          const script = nodeData.script || '';
          const context = {
            input: { message: "Test input data" },
            workflow: {},
            previous: previousOutputs,
            console: {
              log: console.log,
              error: console.error,
              warn: console.warn,
            },
          };
          
          // Create a safe execution environment
          const executor = new TypeScriptExecutor();
          const result = await executor.execute(script, context);
          output = result.output;
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Data processing failed: ${error}`
          });
        }
      }

      return NextResponse.json({
        success: true,
        output,
        logs: [`Action executed: ${nodeData.actionType}`]
      });
    }

    if (nodeType === 'condition') {
      // Handle condition nodes
      const leftValue = nodeData.leftOperand || '';
      const rightValue = nodeData.rightOperand || '';
      const conditionType = nodeData.conditionType || 'equals';
      
      let result = false;
      
      switch (conditionType) {
        case 'equals':
          result = leftValue === rightValue;
          break;
        case 'not_equals':
          result = leftValue !== rightValue;
          break;
        case 'greater_than':
          result = Number(leftValue) > Number(rightValue);
          break;
        case 'less_than':
          result = Number(leftValue) < Number(rightValue);
          break;
        case 'contains':
          result = String(leftValue).includes(String(rightValue));
          break;
        default:
          result = leftValue === rightValue;
      }

      return NextResponse.json({
        success: true,
        output: { result, condition: `${leftValue} ${conditionType} ${rightValue}` },
        logs: [`Condition evaluated: ${leftValue} ${conditionType} ${rightValue} = ${result}`]
      });
    }

    if (nodeType === 'trigger') {
      // Handle trigger nodes
      return NextResponse.json({
        success: true,
        output: { triggered: true, timestamp: new Date().toISOString() },
        logs: [`Trigger activated: ${nodeData.triggerType || 'webhook'}`]
      });
    }

    return NextResponse.json({
      success: false,
      error: `Unsupported node type: ${nodeType}`
    });

  } catch (error) {
    console.error('Error testing node:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error}`
    }, { status: 500 });
  }
}
