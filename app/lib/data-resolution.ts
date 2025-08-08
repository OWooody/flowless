/**
 * Data Resolution Service
 * 
 * Handles dynamic data extraction from various sources:
 * - Event data (current trigger event)
 * - Execution history (previous successful runs)
 * - Workflow context (workflow-level configuration)
 */

export interface DataContext {
  event: any;
  executionHistory?: any[];
  workflow?: any;
  workflowContext?: any;
  organizationId?: string;
}

export interface VariableMapping {
  source: 'event' | 'execution' | 'workflow';
  path: string;
  target: string;
  fallback?: string;
}

export class DataResolutionService {
  /**
   * Resolve a variable expression to its actual value
   */
  static resolveExpression(expression: string, context: DataContext): string | null {
    if (!expression) return null;

    // Handle different expression types
    if (expression.startsWith('event.')) {
      return this.resolveEventPath(expression.substring(6), context.event);
    } else if (expression.startsWith('execution.')) {
      return this.resolveExecutionPath(expression.substring(10), context.executionHistory);
    } else if (expression.startsWith('workflow.')) {
      // For workflow variables, check both workflow object and workflowContext
      const workflowPath = expression.substring(9);
      const workflowValue = this.resolveWorkflowPath(workflowPath, context.workflow);
      if (workflowValue !== null) {
        return workflowValue;
      }
      // If not found in workflow, try workflowContext
      return this.resolveWorkflowContextPath(workflowPath, context.workflowContext);
    } else if (expression.startsWith('context.')) {
      return this.resolveWorkflowContextPath(expression.substring(8), context.workflowContext);
    } else {
      // Direct value
      return expression;
    }
  }

  /**
   * Resolve event data path (e.g., 'userPhone', 'user.name')
   */
  private static resolveEventPath(path: string, eventData: any): string | null {
    if (!eventData) return null;
    
    return this.getNestedValue(eventData, path);
  }

  /**
   * Resolve execution history path (e.g., 'lastResult.orderNumber')
   */
  private static resolveExecutionPath(path: string, executionHistory: any[] | undefined): string | null {
    if (!executionHistory || executionHistory.length === 0) return null;

    // Get the last successful execution
    const lastSuccessful = executionHistory
      .filter(exec => exec.status === 'completed' && exec.results)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

    if (!lastSuccessful) return null;

    if (path.startsWith('lastResult.')) {
      const resultPath = path.substring(11);
      return this.getNestedValue(lastSuccessful.results, resultPath);
    }

    return null;
  }

  /**
   * Resolve workflow path (e.g., 'config.defaultPhone')
   */
  private static resolveWorkflowPath(path: string, workflow: any): string | null {
    if (!workflow) return null;
    
    return this.getNestedValue(workflow, path);
  }

  /**
   * Resolve workflow context path (e.g., 'promoCode', 'welcomeCode')
   */
  private static resolveWorkflowContextPath(path: string, workflowContext: any): string | null {
    if (!workflowContext) return null;
    
    return this.getNestedValue(workflowContext, path);
  }

  /**
   * Get nested object value by dot notation
   */
  private static getNestedValue(obj: any, path: string): string | null {
    if (!obj || !path) return null;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }

    return current != null ? String(current) : null;
  }

  /**
   * Extract variables from text that may contain {{}} expressions
   */
  static extractVariablesFromText(text: string): string[] {
    if (!text) return [];
    
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(text)) !== null) {
      variables.push(match[1]); // Extract the expression inside {{}}
    }
    
    return variables;
  }

  /**
   * Resolve variables in text and replace them with actual values
   */
  static resolveTextVariables(text: string, context: DataContext): string {
    if (!text) return text;
    
    const variables = this.extractVariablesFromText(text);
    let resolvedText = text;
    
    variables.forEach(variable => {
      const value = this.resolveExpression(variable, context);
      if (value !== null) {
        resolvedText = resolvedText.replace(`{{${variable}}}`, value);
      }
    });
    
    return resolvedText;
  }

  /**
   * Resolve all variable mappings for a WhatsApp action
   */
  static resolveWhatsAppVariables(
    action: any, 
    context: DataContext
  ): {
    fromPhone?: string;
    toPhone?: string;
    bodyVariable1?: string;
    bodyVariable2?: string;
    bodyVariable3?: string;
    buttonVariable?: string;
  } {
    const resolved: any = {};

    // Resolve each field that might contain variables
    const fields = ['fromPhone', 'toPhone', 'bodyVariable1', 'bodyVariable2', 'bodyVariable3', 'buttonVariable'];
    
    fields.forEach(field => {
      const value = action[field];
      if (value && typeof value === 'string') {
        // Check if it contains variables
        if (value.includes('{{')) {
          resolved[field] = this.resolveTextVariables(value, context);
        } else {
          resolved[field] = value;
        }
      }
    });

    // Fallback to direct values if no mapping or mapping failed
    if (!resolved.fromPhone && action.fromPhone) resolved.fromPhone = action.fromPhone;
    if (!resolved.toPhone && action.toPhone) resolved.toPhone = action.toPhone;
    if (!resolved.bodyVariable1 && action.bodyVariable1) resolved.bodyVariable1 = action.bodyVariable1;
    if (!resolved.bodyVariable2 && action.bodyVariable2) resolved.bodyVariable2 = action.bodyVariable2;
    if (!resolved.bodyVariable3 && action.bodyVariable3) resolved.bodyVariable3 = action.bodyVariable3;
    if (!resolved.buttonVariable && action.buttonVariable) resolved.buttonVariable = action.buttonVariable;

    return resolved;
  }

  /**
   * Get execution history for a workflow
   */
  static async getExecutionHistory(workflowId: string, limit: number = 5): Promise<any[]> {
    const prisma = await import('./prisma').then(m => m.default);

    try {
      const executions = await prisma.workflowExecution.findMany({
        where: {
          workflowId,
          status: 'completed'
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: limit,
        include: {
          steps: true
        }
      });

      return executions;
    } catch (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }
  }
} 