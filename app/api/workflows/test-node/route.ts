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
      // Handle condition nodes with custom JavaScript code and multiple branches
      try {
        const branches = nodeData.branches || [
          { id: 'if-1', type: 'if', condition: 'return true;', label: 'If', isActive: true },
          { id: 'else-1', type: 'else', condition: undefined, label: 'Else', isActive: false }
        ];
        
        // Create test context with sample data
        const testContext = {
          event: {
            user: { age: 25, country: 'US', isVIP: true, email: 'user@example.com' },
            order: { total: 150, status: 'pending', items: ['item1', 'item2'] },
            timestamp: new Date().toISOString(),
            category: 'purchase',
            value: 150
          },
          workflow: {
            config: { minAge: 18, maxOrderValue: 1000, allowedCountries: ['US', 'CA', 'UK'] },
            variables: { promoCode: 'SUMMER20', discount: 0.1 }
          },
          execution: [
            { output: { previousResult: 'success' }, timestamp: new Date().toISOString() }
          ]
        };
        
        // Test each branch and determine which one would execute
        const branchResults = [];
        let executedBranch = null;
        
        for (const branch of branches) {
          if (branch.type === 'else') {
            // Else branch doesn't have a condition
            branchResults.push({
              branchId: branch.id,
              branchType: branch.type,
              condition: 'No condition (default path)',
              result: null,
              wouldExecute: !executedBranch // Execute if no other branch executed
            });
            if (!executedBranch) {
              executedBranch = branch;
            }
          } else if (branch.condition && branch.isActive) {
            try {
              // Safely execute the condition code
              const result = new Function('event', 'workflow', 'execution', 
                `return (function() { ${branch.condition} })();`
              )(testContext.event, testContext.workflow, testContext.execution);
              
              const booleanResult = Boolean(result);
              branchResults.push({
                branchId: branch.id,
                branchType: branch.type,
                condition: branch.condition,
                result: booleanResult,
                evaluatedValue: result,
                wouldExecute: booleanResult && !executedBranch
              });
              
              if (booleanResult && !executedBranch) {
                executedBranch = branch;
              }
            } catch (error) {
              branchResults.push({
                branchId: branch.id,
                branchType: branch.type,
                condition: branch.condition,
                result: null,
                error: error.message,
                wouldExecute: false
              });
            }
          } else {
            branchResults.push({
              branchId: branch.id,
              branchType: branch.type,
              condition: branch.condition || 'No condition',
              result: null,
              wouldExecute: false,
              inactive: !branch.isActive
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          output: { 
            executedBranch: executedBranch ? executedBranch.id : null,
            branchResults,
            testData: testContext,
            totalBranches: branches.length,
            activeBranches: branches.filter(b => b.isActive).length
          },
          logs: [
            `Condition node tested with ${branches.length} branches`,
            `Executed branch: ${executedBranch ? executedBranch.id : 'none'}`,
            ...branchResults.map(b => 
              `${b.branchType} branch ${b.branchId}: ${b.result === null ? 'no condition' : b.result}`
            )
          ]
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `Condition evaluation failed: ${error.message}`,
          branches: nodeData.branches
        });
      }
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
