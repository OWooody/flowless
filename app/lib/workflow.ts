import prisma from './prisma';

// Type definitions for workflow system
export type TriggerConfig = {
  eventType: string;
  filters: {
    eventName?: string;
    itemName?: string;
    itemCategory?: string;
    itemId?: string;
    value?: number;
    category?: string;
  };
  conditions?: {
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    field: string;
    value: any;
  }[];
};









export type ConditionActionConfig = {
  type: 'condition';
  condition: string;
  description?: string;
};

export type PersonalizationActionConfig = {
  type: 'personalization';
  ruleName: string;
  trigger: string;
  message: string;
  messageType: string;
  variableMappings?: {
    ruleName?: string;
    trigger?: string;
    message?: string;
  };
};

export type ActionConfig = ConditionActionConfig | PersonalizationActionConfig;

export type WorkflowConfig = {
  id: string;
  name: string;
  description?: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  isActive: boolean;
  organizationId?: string;
  userId: string;
};

export type WorkflowExecutionResult = {
  success: boolean;
  executionId: string;
  actionResults: {
    actionIndex: number;
    actionType: string;
    success: boolean;
    result?: any;
    error?: string;
  }[];
  error?: string;
  totalDurationMs?: number;
};

export type WorkflowStepData = {
  stepOrder: number;
  stepType: 'trigger_validation' | 'action_execution' | 'data_processing';
  stepName: string;
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
  metadata?: any;
};

class WorkflowService {
  /**
   * Execute a workflow with input data
   */
  async executeWorkflow(workflowId: string, inputData: any): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const executionId = await this.logExecution(workflowId, 'running', { inputData });
    
    try {
      // Step 1: Get workflow configuration
      await this.logStep(executionId, {
        stepOrder: 1,
        stepType: 'data_processing',
        stepName: 'Load Workflow Configuration',
        inputData: { workflowId }
      });

      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow || !workflow.isActive) {
        throw new Error('Workflow not found or inactive');
      }

      await this.updateStep(executionId, 1, 'completed', { 
        outputData: { 
          workflowName: workflow.name,
          actionCount: workflow.actions.length 
        } 
      });

      // Step 2: Validate trigger conditions
      await this.logStep(executionId, {
        stepOrder: 2,
        stepType: 'trigger_validation',
        stepName: 'Validate Trigger Conditions',
        inputData: { trigger: workflow.trigger, input: inputData }
      });

      const triggerValid = await this.validateTrigger(workflow.trigger as TriggerConfig, inputData);
      
      if (!triggerValid) {
        await this.updateStep(executionId, 2, 'failed', { 
          errorMessage: 'Trigger conditions not met' 
        });
        
        // Clean up any remaining running steps
        await this.cleanupRunningSteps(executionId, 2);
        
        await this.updateExecution(executionId, 'failed', { 
          success: false, 
          error: 'Trigger conditions not met',
          totalDurationMs: Date.now() - startTime
        });
        return { 
          success: false, 
          executionId,
          actionResults: [], 
          error: 'Trigger conditions not met',
          totalDurationMs: Date.now() - startTime
        };
      }

      await this.updateStep(executionId, 2, 'completed', { 
        outputData: { triggerValid: true } 
      });

      // Step 3: Execute actions sequentially
      const actionResults = [];
      const workflowContext: any = { ...inputData }; // Start with input data
      const loggedSteps: number[] = []; // Track which steps were logged
      
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i] as ActionConfig;
        const stepOrder = 3 + i;
        
        await this.logStep(executionId, {
          stepOrder,
          stepType: 'action_execution',
          stepName: `Execute Action ${i + 1}: ${action.type}`,
          inputData: { action, inputData: inputData, context: workflowContext }
        });
        
        loggedSteps.push(stepOrder);
        
        try {
          const result = await this.executeAction(action, inputData, workflowId, workflowContext);
          actionResults.push({
            actionIndex: i,
            actionType: action.type,
            success: true,
            result
          });
          
          // Add result to workflow context for subsequent actions
          
          await this.updateStep(executionId, stepOrder, 'completed', { 
            outputData: result,
            context: workflowContext
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          actionResults.push({
            actionIndex: i,
            actionType: action.type,
            success: false,
            error: errorMessage
          });
          
          await this.updateStep(executionId, stepOrder, 'failed', { 
            errorMessage 
          });
          
          // Clean up any remaining running steps
          await this.cleanupRunningSteps(executionId, stepOrder);
          
          // For now, stop execution on first failure
          // In the future, we could add retry logic or continue-on-error options
          break;
        }
      }

      const totalDurationMs = Date.now() - startTime;
      const overallSuccess = actionResults.every(r => r.success);
      const executionResult: WorkflowExecutionResult = {
        success: overallSuccess,
        executionId,
        actionResults,
        totalDurationMs
      };

      // Determine the final status based on overall success
      const finalStatus = overallSuccess ? 'completed' : 'failed';
      
      // If successful, mark any remaining logged steps as skipped
      if (overallSuccess) {
        await this.markRemainingStepsAsSkipped(executionId, loggedSteps);
      }
      
      await this.updateExecution(executionId, finalStatus, executionResult);
      return executionResult;

    } catch (error) {
      const totalDurationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Clean up any remaining running steps
      await this.cleanupRunningSteps(executionId, 0);
      
      await this.updateExecution(executionId, 'failed', { 
        success: false, 
        error: errorMessage,
        totalDurationMs
      });
      
      return {
        success: false,
        executionId,
        actionResults: [],
        error: errorMessage,
        totalDurationMs
      };
    }
  }

  /**
   * Validate if a trigger should fire based on input data
   */
  async validateTrigger(trigger: TriggerConfig, input: any): Promise<boolean> {
    // Check input type
    if (trigger.eventType !== input.category) {
      return false;
    }

    // Check filters
    if (trigger.filters.eventName && input.name !== trigger.filters.eventName) {
      return false;
    }

    if (trigger.filters.itemName && input.itemName !== trigger.filters.itemName) {
      return false;
    }

    if (trigger.filters.itemCategory && input.itemCategory !== trigger.filters.itemCategory) {
      return false;
    }

    if (trigger.filters.itemId && input.itemId !== trigger.filters.itemId) {
      return false;
    }

    if (trigger.filters.value !== undefined && input.value !== trigger.filters.value) {
      return false;
    }

    if (trigger.filters.category && input.category !== trigger.filters.category) {
      return false;
    }

    // Check additional conditions
    if (trigger.conditions) {
      for (const condition of trigger.conditions) {
        const fieldValue = this.getNestedValue(input, condition.field);
        
        switch (condition.operator) {
          case 'equals':
            if (fieldValue !== condition.value) return false;
            break;
          case 'contains':
            if (typeof fieldValue === 'string' && !fieldValue.includes(condition.value)) {
              return false;
            }
            break;
          case 'greater_than':
            if (typeof fieldValue === 'number' && fieldValue <= condition.value) {
              return false;
            }
            break;
          case 'less_than':
            if (typeof fieldValue === 'number' && fieldValue >= condition.value) {
              return false;
            }
            break;
        }
      }
    }

    return true;
  }

  /**
   * Execute a single action
   */
  async executeAction(action: ActionConfig, inputData: any, workflowId?: string, workflowContext?: any): Promise<any> {
    switch (action.type) {
      case 'condition':
        return this.executeConditionAction(action as ConditionActionConfig, inputData, workflowContext);
      case 'personalization':
        return this.executePersonalizationAction(action as PersonalizationActionConfig, inputData, workflowId, workflowContext);
      default:
        const actionType = (action as any).type;
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }







  /**
   * Execute personalization action
   */
  async executePersonalizationAction(action: PersonalizationActionConfig, inputData: any, workflowId?: string, workflowContext?: any): Promise<any> {
    try {
      console.log('🎯 Executing personalization action:', action);
      
      // Import the data resolution service
      const { DataResolutionService } = await import('./data-resolution');

      // Create data context for variable resolution
      const dataContext = {
        input: inputData,
        execution: workflowContext?.execution || {},
        workflow: workflowContext?.workflow || {},
        context: workflowContext || {}
      };

      // Resolve action parameters
      const resolvedRuleName = action.variableMappings?.ruleName 
        ? DataResolutionService.resolveExpression(action.variableMappings.ruleName, dataContext)
        : action.ruleName;

      const resolvedTrigger = action.variableMappings?.trigger
        ? DataResolutionService.resolveExpression(action.variableMappings.trigger, dataContext)
        : action.trigger;

      const resolvedMessage = action.variableMappings?.message
        ? DataResolutionService.resolveExpression(action.variableMappings.message, dataContext)
        : action.message;

      // Ensure we have valid values
      if (!resolvedTrigger) {
        throw new Error('Trigger is required for personalization action');
      }

      if (!resolvedMessage) {
        throw new Error('Message is required for personalization action');
      }

      // Create personalization rule data
      const ruleData = {
        name: resolvedRuleName,
        description: `Workflow-generated rule for ${resolvedTrigger}`,
        conditions: this.getConditionsFromTrigger(resolvedTrigger),
        content: {
          type: action.messageType,
          template: resolvedMessage,
          variables: {}
        },
        priority: 50
      };

      // Create the personalization rule
      const response = await fetch('/api/personalization/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error('Failed to create personalization rule');
      }

      const result = await response.json();
      
      console.log('🎯 Personalization action completed:', result);
      
      return {
        success: true,
        ruleId: result.rule?.id,
        ruleName: resolvedRuleName,
        trigger: resolvedTrigger,
        message: resolvedMessage,
        messageType: action.messageType
      };
    } catch (error) {
      console.error('🎯 Error executing personalization action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getConditionsFromTrigger(trigger: string) {
    switch (trigger) {
      case 'first_visit':
        return [{ field: 'user.behavior.visitCount', operator: 'equals', value: 1, logic: 'AND' }];
      case 'high_spender':
        return [{ field: 'user.behavior.totalSpent', operator: 'greater_than', value: 1000, logic: 'AND' }];
      case 'cart_abandoner':
        return [
          { field: 'user.behavior.cartAbandoned', operator: 'equals', value: true, logic: 'AND' },
          { field: 'user.behavior.cartValue', operator: 'greater_than', value: 50, logic: 'AND' }
        ];
      case 'inactive_user':
        return [{ field: 'user.behavior.lastVisit', operator: 'less_than', value: 30, logic: 'AND' }];
      default:
        return [];
    }
  }

  /**
   * Execute condition action
   */
  async executeConditionAction(action: ConditionActionConfig, inputData: any, workflowContext?: any): Promise<any> {
    try {
      console.log('🔍 Executing condition action:', action);
      
      // Import the data resolution service
      const { DataResolutionService } = await import('./data-resolution');

      // Create data context for variable resolution
      const dataContext = {
        input: inputData,
        execution: workflowContext?.execution || {},
        workflow: workflowContext?.workflow || {},
        context: workflowContext || {}
      };

      // Resolve the condition expression
      const resolvedCondition = DataResolutionService.resolveExpression(action.condition, dataContext);
      
      if (!resolvedCondition) {
        throw new Error('Failed to resolve condition expression');
      }

      // Evaluate the condition
      const result = this.evaluateCondition(resolvedCondition, inputData, workflowContext);
      
      console.log('✅ Condition evaluation result:', result);
      
      return {
        condition: action.condition,
        resolvedCondition,
        result,
        description: action.description
      };
    } catch (error) {
      console.error('❌ Error executing condition action:', error);
      throw error;
    }
  }

  /**
   * Evaluate a condition expression.
   * This is a placeholder for actual condition evaluation logic.
   * In a real application, you would parse and evaluate the expression
   * based on the resolvedCondition and inputData.
   */
  private evaluateCondition(expression: any, inputData: any, workflowContext?: any): boolean {
    // Example: Simple string comparison for demonstration
    if (typeof expression === 'string') {
      const resolvedValue = this.getNestedValue(inputData, expression);
      if (typeof resolvedValue === 'string') {
        return resolvedValue.toLowerCase() === 'true';
      }
      return Boolean(resolvedValue);
    }

    // More complex evaluation logic would go here
    // For example, using a library like `eval` or a dedicated parser
    // that can handle operators, functions, and nested properties.
    // This is a simplified example.
    return false;
  }





  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Log workflow execution start
   */
  async logExecution(workflowId: string, status: string, results?: any): Promise<string> {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        status,
        triggerEvent: results?.triggerEvent || null,
        results: results ? JSON.parse(JSON.stringify(results)) : null
      }
    });
    return execution.id;
  }

  /**
   * Update workflow execution status
   */
  async updateExecution(executionId: string, status: string, results?: any): Promise<void> {
    const updateData: any = {
      status,
      results: results ? JSON.parse(JSON.stringify(results)) : null,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : null
    };

    if (results?.totalDurationMs) {
      updateData.totalDurationMs = results.totalDurationMs;
    }

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: updateData
    });
  }

  /**
   * Log a workflow step
   */
  async logStep(executionId: string, stepData: WorkflowStepData): Promise<string> {
    const step = await prisma.workflowStep.create({
      data: {
        executionId,
        stepOrder: stepData.stepOrder,
        stepType: stepData.stepType,
        stepName: stepData.stepName,
        status: 'running',
        inputData: stepData.inputData ? JSON.parse(JSON.stringify(stepData.inputData)) : null,
        metadata: stepData.metadata ? JSON.parse(JSON.stringify(stepData.metadata)) : null
      }
    });
    return step.id;
  }

  /**
   * Update a workflow step
   */
  async updateStep(executionId: string, stepOrder: number, status: string, data?: any): Promise<void> {
    const updateData: any = {
      status,
      endTime: status === 'completed' || status === 'failed' ? new Date() : null
    };

    if (data?.outputData) {
      updateData.outputData = JSON.parse(JSON.stringify(data.outputData));
    }

    if (data?.errorMessage) {
      updateData.errorMessage = data.errorMessage;
    }

    // Calculate duration if step is completed
    if (status === 'completed' || status === 'failed') {
      const step = await prisma.workflowStep.findFirst({
        where: { executionId, stepOrder }
      });
      if (step) {
        updateData.durationMs = Date.now() - step.startTime.getTime();
      }
    }

    await prisma.workflowStep.updateMany({
      where: { executionId, stepOrder },
      data: updateData
    });
  }

  /**
   * Clean up any remaining running steps for a given execution.
   * This ensures all steps are marked as completed or failed.
   */
  private async cleanupRunningSteps(executionId: string, lastLoggedStepOrder: number) {
    try {
      const stepsToUpdate = await prisma.workflowStep.findMany({
        where: { executionId, status: 'running' }
      });

      for (const step of stepsToUpdate) {
        if (step.stepOrder > lastLoggedStepOrder) {
          await this.updateStep(executionId, step.stepOrder, 'failed', { 
            errorMessage: 'Workflow execution interrupted' 
          });
        }
      }
    } catch (error) {
      console.error('Error cleaning up running steps:', error);
      // Don't throw here as this is cleanup code
    }
  }

  /**
   * Clean up orphaned running steps for all executions.
   * This handles cases where executions were interrupted and steps were left in running status.
   */
  async cleanupOrphanedRunningSteps() {
    try {
      const orphanedSteps = await prisma.workflowStep.findMany({
        where: { 
          status: 'running',
          execution: {
            status: { in: ['completed', 'failed'] }
          }
        },
        include: {
          execution: true
        }
      });

      for (const step of orphanedSteps) {
        await this.updateStep(step.executionId, step.stepOrder, 'failed', {
          errorMessage: 'Execution completed but step was left in running status'
        });
      }

      console.log(`Cleaned up ${orphanedSteps.length} orphaned running steps`);
    } catch (error) {
      console.error('Error cleaning up orphaned running steps:', error);
    }
  }

  /**
   * Mark any remaining logged steps as skipped.
   */
  private async markRemainingStepsAsSkipped(executionId: string, loggedStepOrders: number[]) {
    try {
      const maxStepOrder = await prisma.workflowStep.findFirst({
        where: { executionId },
        orderBy: { stepOrder: 'desc' }
      });
      const maxOrder = maxStepOrder ? maxStepOrder.stepOrder : 0;

      for (let i = 1; i <= maxOrder; i++) {
        if (!loggedStepOrders.includes(i)) {
          await this.updateStep(executionId, i, 'skipped', {
            errorMessage: 'Workflow completed successfully, marking remaining steps as skipped'
          });
        }
      }
    } catch (error) {
      console.error('Error marking remaining steps as skipped:', error);
    }
  }

  /**
   * Get workflows that match the given input
   */
  async getMatchingWorkflows(input: string, data: any): Promise<WorkflowConfig[]> {
    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          isActive: true,
          trigger: {
            path: ['eventType'],
            equals: input
          }
        }
      });

      // Filter workflows based on trigger conditions and map to WorkflowConfig
      const matchingWorkflows = workflows
        .filter(workflow => {
          const trigger = workflow.trigger as TriggerConfig;
          return this.validateTrigger(trigger, data);
        })
        .map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || undefined,
          trigger: workflow.trigger as TriggerConfig,
          actions: workflow.actions as ActionConfig[],
          isActive: workflow.isActive,
          organizationId: workflow.organizationId || undefined,
          userId: workflow.userId
        }));

      return matchingWorkflows;
    } catch (error) {
      console.error('Error getting matching workflows:', error);
      return [];
    }
  }

  /**
   * Get execution history for a workflow
   */
  async getExecutionHistory(workflowId: string): Promise<any[]> {
    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: 10, // Get last 10 executions
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      }
    });

    return executions.map(execution => ({
      executionId: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      results: execution.results,
      steps: execution.steps.map(step => ({
        stepOrder: step.stepOrder,
        stepType: step.stepType,
        stepName: step.stepName,
        status: step.status,
        inputData: step.inputData,
        outputData: step.outputData,
        errorMessage: step.errorMessage,
        metadata: step.metadata
      }))
    }));
  }
}

export const workflowService = new WorkflowService(); 