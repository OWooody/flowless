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
   * Execute a workflow based on a trigger event
   */
  async executeWorkflow(workflowId: string, triggerEvent: any): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const executionId = await this.logExecution(workflowId, 'running', { triggerEvent });
    
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
        inputData: { trigger: workflow.trigger, event: triggerEvent }
      });

      const triggerValid = await this.validateTrigger(workflow.trigger as TriggerConfig, triggerEvent);
      
      if (!triggerValid) {
        await this.updateStep(executionId, 2, 'failed', { 
          errorMessage: 'Trigger conditions not met' 
        });
        await this.updateExecution(executionId, 'completed', { 
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
      const workflowContext: any = { ...triggerEvent }; // Start with trigger event data
      
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i] as ActionConfig;
        const stepOrder = 3 + i;
        
        await this.logStep(executionId, {
          stepOrder,
          stepType: 'action_execution',
          stepName: `Execute Action ${i + 1}: ${action.type}`,
          inputData: { action, eventData: triggerEvent, context: workflowContext }
        });
        
        try {
          const result = await this.executeAction(action, workflowContext, workflowId, workflowContext);
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
      await this.updateExecution(executionId, finalStatus, executionResult);
      return executionResult;

    } catch (error) {
      const totalDurationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
   * Validate if a trigger should fire based on event data
   */
  async validateTrigger(trigger: TriggerConfig, event: any): Promise<boolean> {
    // Check event type
    if (trigger.eventType !== event.category) {
      return false;
    }

    // Check filters
    if (trigger.filters.eventName && event.name !== trigger.filters.eventName) {
      return false;
    }

    if (trigger.filters.itemName && event.itemName !== trigger.filters.itemName) {
      return false;
    }

    if (trigger.filters.itemCategory && event.itemCategory !== trigger.filters.itemCategory) {
      return false;
    }

    if (trigger.filters.itemId && event.itemId !== trigger.filters.itemId) {
      return false;
    }

    if (trigger.filters.value !== undefined && event.value !== trigger.filters.value) {
      return false;
    }

    if (trigger.filters.category && event.category !== trigger.filters.category) {
      return false;
    }

    // Check additional conditions
    if (trigger.conditions) {
      for (const condition of trigger.conditions) {
        const fieldValue = this.getNestedValue(event, condition.field);
        
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
  async executeAction(action: ActionConfig, eventData: any, workflowId?: string, workflowContext?: any): Promise<any> {
    switch (action.type) {
      case 'personalization':
        return this.executePersonalizationAction(action as PersonalizationActionConfig, eventData, workflowId, workflowContext);
      case 'condition':
        return this.executeConditionAction(action as ConditionActionConfig, eventData, workflowContext);
      default:
        const actionType = (action as any).type;
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }







  /**
   * Execute personalization action
   */
  async executePersonalizationAction(action: PersonalizationActionConfig, eventData: any, workflowId?: string, workflowContext?: any): Promise<any> {
    try {
      console.log('🎯 Executing personalization action:', action);
      
      // Import the data resolution service
      const { DataResolutionService } = await import('./data-resolution');

      // Create data context for variable resolution
      const dataContext = {
        event: eventData,
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
  async executeConditionAction(action: ConditionActionConfig, eventData: any, workflowContext?: any): Promise<any> {
    try {
      // Create execution context with available variables
      const context = {
        event: eventData,
        workflow: workflowContext,
        execution: []
      };
      
      // Safely execute the user's condition code
      const result = new Function('event', 'workflow', 'execution', 
        `return (function() { ${action.condition} })();`
      )(context.event, context.workflow, context.execution);
      
      return {
        condition: action.condition,
        result: Boolean(result),
        context: context,
        description: action.description
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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
   * Get workflows that should be triggered by an event
   */
  async getMatchingWorkflows(event: string, data: any): Promise<WorkflowConfig[]> {
    const workflows = await prisma.workflow.findMany({
      where: {
        isActive: true,
        organizationId: data.organizationId || null
      }
    });

    const matchingWorkflows: WorkflowConfig[] = [];
    
    for (const workflow of workflows) {
      const triggerValid = await this.validateTrigger(workflow.trigger as TriggerConfig, data);
      if (triggerValid) {
        matchingWorkflows.push(workflow as unknown as WorkflowConfig);
      }
    }

    return matchingWorkflows;
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