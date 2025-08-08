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

export type PushActionConfig = {
  type: 'push_notification';
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
  targetUsers: 'all' | 'segment' | 'specific';
  segmentId?: string;
  userIds?: string[];
};

export type WhatsAppActionConfig = {
  type: 'whatsapp_message';
  provider: string;
  templateName: string;
  namespace: string;
  language: string;
  fromPhone?: string;  // Business phone number (from provider config or user input)
  toPhone?: string;    // Target phone number (from user data or user input)
  bodyVariable1?: string;
  bodyVariable2?: string;
  bodyVariable3?: string;
  buttonVariable?: string;
  // Variable mapping for dynamic data extraction
  variableMappings?: {
    fromPhone?: string;  // Expression like 'event.userPhone' or 'execution.lastResult.phone'
    toPhone?: string;    // Expression like 'event.phone' or 'execution.lastResult.userPhone'
    bodyVariable1?: string; // Expression like 'event.userName' or 'execution.lastResult.customerName'
    bodyVariable2?: string; // Expression like 'event.orderNumber' or 'execution.lastResult.orderId'
    bodyVariable3?: string; // Expression like 'event.amount' or 'execution.lastResult.total'
    buttonVariable?: string; // Expression like 'event.buttonText' or 'execution.lastResult.action'
  };
};

export type SMSActionConfig = {
  type: 'sms_message';
  provider: string;
  templateName?: string;
  language: string;
  fromPhone?: string;  // Business phone number (from provider config or user input)
  toPhone?: string;    // Target phone number (from user data or user input)
  message?: string;    // Direct message content
  // Variable mapping for dynamic data extraction
  variableMappings?: {
    fromPhone?: string;  // Expression like 'event.userPhone' or 'execution.lastResult.phone'
    toPhone?: string;    // Expression like 'event.phone' or 'execution.lastResult.userPhone'
    message?: string;    // Expression like 'event.message' or 'execution.lastResult.content'
  };
};

export type PromoCodeActionConfig = {
  type: 'promo_code';
  batchId: string;
  batchName: string;
  outputVariable: string;
  codeType: 'random' | 'sequential' | 'specific';
  specificCode?: string;
};

export type ConditionActionConfig = {
  type: 'condition';
  conditionType: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  leftOperand: string;
  rightOperand: string;
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

export type ActionConfig = PushActionConfig | WhatsAppActionConfig | SMSActionConfig | PromoCodeActionConfig | ConditionActionConfig | PersonalizationActionConfig;

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
          if (action.type === 'promo_code' && result.code) {
            const outputVar = (action as PromoCodeActionConfig).outputVariable || 'promoCode';
            workflowContext[outputVar] = result.code;
            workflowContext[`${outputVar}_batchId`] = result.batchId;
            workflowContext[`${outputVar}_batchName`] = result.batchName;
            workflowContext[`${outputVar}_discountType`] = result.discountType;
            workflowContext[`${outputVar}_discountValue`] = result.discountValue;
          }
          
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
      case 'push_notification':
        return this.executePushAction(action as PushActionConfig, eventData);
      case 'whatsapp_message':
        return this.executeWhatsAppAction(action as WhatsAppActionConfig, eventData, workflowId, workflowContext);
              case 'sms_message':
          return this.executeSMSAction(action as SMSActionConfig, eventData, workflowId, workflowContext);
        case 'personalization':
          return this.executePersonalizationAction(action as PersonalizationActionConfig, eventData, workflowId, workflowContext);
        case 'promo_code':
          return this.executePromoCodeAction(action as PromoCodeActionConfig, eventData, workflowId);
        case 'condition':
          return this.executeConditionAction(action as ConditionActionConfig, eventData, workflowContext);
      default:
        const actionType = (action as any).type;
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Execute push notification action
   */
  async executePushAction(action: PushActionConfig, eventData: any): Promise<any> {
    // Import the push notification service
    const { pushNotificationService } = await import('../../lib/push-notifications');

    // Determine target users
    let targetUserIds: string[] = [];
    
    switch (action.targetUsers) {
      case 'all':
        // Get all users in the organization (this would need to be implemented based on your user model)
        // For now, we'll use the event's userId as a fallback
        targetUserIds = [eventData.userId].filter(Boolean);
        break;
      
      case 'segment':
        if (!action.segmentId) {
          throw new Error('Segment ID required for segment targeting');
        }
        // Get users in the segment (this would need to be implemented)
        // For now, we'll use the event's userId as a fallback
        targetUserIds = [eventData.userId].filter(Boolean);
        break;
      
      case 'specific':
        if (!action.userIds || action.userIds.length === 0) {
          throw new Error('User IDs required for specific targeting');
        }
        targetUserIds = action.userIds;
        break;
    }

    if (targetUserIds.length === 0) {
      throw new Error('No target users found');
    }

    // Prepare notification payload
    const payload = {
      title: action.title,
      body: action.body,
      icon: action.icon,
      data: {
        ...action.data,
        workflowEvent: eventData
      }
    };

    // Send notification
    const result = await pushNotificationService.sendNotificationToUsers(targetUserIds, payload);
    
    return {
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      errors: result.errors
    };
  }

  /**
   * Execute WhatsApp message action
   */
  async executeWhatsAppAction(action: WhatsAppActionConfig, eventData: any, workflowId?: string, workflowContext?: any): Promise<any> {
    // Import the WhatsApp service and data resolution service
    const { whatsappService } = await import('./whatsapp/service');
    const { DataResolutionService } = await import('./data-resolution');

    // Get organization ID from workflow or event data
    let organizationId = eventData.organizationId;
    if (!organizationId && workflowId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { organizationId: true }
      });
      organizationId = workflow?.organizationId;
    }

    if (!organizationId) {
      throw new Error('Organization ID is required for WhatsApp actions. Please ensure the workflow has an organization ID or the event data contains organizationId.');
    }

    // Get execution history for data resolution
    let executionHistory: any[] = [];
    if (workflowId) {
      try {
        executionHistory = await DataResolutionService.getExecutionHistory(workflowId, 5);
      } catch (error) {
        console.warn('Could not fetch execution history:', error);
      }
    }

    // Create data context for variable resolution
    const dataContext = {
      event: eventData,
      executionHistory,
      organizationId,
      workflowContext
    };

    // Resolve variables using data resolution service
    const resolvedVariables = DataResolutionService.resolveWhatsAppVariables(action, dataContext);

    // Prepare variables object
    const variables: Record<string, string> = {};
    if (resolvedVariables.bodyVariable1) variables['1'] = resolvedVariables.bodyVariable1;
    if (resolvedVariables.bodyVariable2) variables['2'] = resolvedVariables.bodyVariable2;
    if (resolvedVariables.bodyVariable3) variables['3'] = resolvedVariables.bodyVariable3;
    if (resolvedVariables.buttonVariable) variables['button'] = resolvedVariables.buttonVariable;

    // Get from phone number (business number)
    let fromPhone = resolvedVariables.fromPhone;
    if (!fromPhone) {
      // Try to get from provider config
      try {
        const provider = await whatsappService.getProvider(organizationId);
        const credentials = provider?.credentials as any;
        if (credentials?.fromPhone) {
          fromPhone = credentials.fromPhone;
        }
      } catch (error) {
        console.warn('Could not get from phone from provider config:', error);
      }
    }
    
    if (!fromPhone) {
      throw new Error('From phone number is required. Please configure it in the workflow action or provider settings.');
    }

    // Get to phone number (target user)
    let toPhone = resolvedVariables.toPhone;
    if (!toPhone) {
      // Try to get from event data
      toPhone = eventData.userPhone || eventData.phone || eventData.toPhone;
    }
    
    if (!toPhone) {
      throw new Error('To phone number is required. Please configure it in the workflow action or ensure event data contains phone number.');
    }

    // Create message object
    const message = {
      from: fromPhone,
      to: toPhone,
      templateName: action.templateName,
      namespace: action.namespace,
      language: action.language,
      variables: variables
    };

    // Send message using the existing WhatsApp service
    const result = await whatsappService.sendMessage(organizationId, message);
    
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    };
  }

  /**
   * Execute SMS message action
   */
  async executeSMSAction(action: SMSActionConfig, eventData: any, workflowId?: string, workflowContext?: any): Promise<any> {
    // Import the SMS service and data resolution service
    const { SMSService } = await import('./sms/service');
    const { DataResolutionService } = await import('./data-resolution');

    const smsService = new SMSService();
    const dataResolutionService = new DataResolutionService();

    // Get organization ID from workflow or event data
    let organizationId = eventData.organizationId;
    if (!organizationId && workflowId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { organizationId: true }
      });
      organizationId = workflow?.organizationId;
    }

    if (!organizationId) {
      throw new Error('Organization ID not found for SMS action');
    }

    // Get execution history for data resolution
    const executionHistory = workflowId ? await this.getExecutionHistory(workflowId) : [];

    // Create data context for variable resolution
    const dataContext = {
      event: eventData,
      executionHistory,
      organizationId,
      workflowContext // Pass workflowContext for dynamic variable resolution
    };

    // Resolve variables using data resolution service
    const resolvedFromPhone = action.variableMappings?.fromPhone 
      ? DataResolutionService.resolveExpression(action.variableMappings.fromPhone, dataContext)
      : action.fromPhone;

    const resolvedToPhone = action.variableMappings?.toPhone 
      ? DataResolutionService.resolveExpression(action.variableMappings.toPhone, dataContext)
      : action.toPhone;

    const resolvedMessage = action.variableMappings?.message 
      ? DataResolutionService.resolveExpression(action.variableMappings.message, dataContext)
      : action.message;

    // Prepare SMS message
    const smsMessage = {
      from: resolvedFromPhone || undefined,
      to: resolvedToPhone || '', // Ensure to is always a string
      templateName: action.templateName,
      message: resolvedMessage || undefined,
      language: action.language,
      variables: action.templateName ? {
        // Add any template variables here if needed
      } : undefined
    };

    // Send SMS message
    const result = await smsService.sendMessage(organizationId, smsMessage);

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    };
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
    // Import the data resolution service
    const { DataResolutionService } = await import('./data-resolution');

    // Create data context for variable resolution
    const dataContext = {
      event: eventData,
      workflowContext
    };

    // Resolve left operand
    const leftValue = DataResolutionService.resolveExpression(action.leftOperand, dataContext);
    
    // Resolve right operand
    const rightValue = DataResolutionService.resolveExpression(action.rightOperand, dataContext);

    // Evaluate condition
    let result = false;
    
    switch (action.conditionType) {
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
      case 'not_contains':
        result = !String(leftValue).includes(String(rightValue));
        break;
      default:
        throw new Error(`Unknown condition type: ${action.conditionType}`);
    }

    return {
      conditionType: action.conditionType,
      leftOperand: action.leftOperand,
      rightOperand: action.rightOperand,
      leftValue,
      rightValue,
      result,
      description: action.description
    };
  }

  async executePromoCodeAction(action: PromoCodeActionConfig, eventData: any, workflowId?: string): Promise<any> {
    // Get organization ID and user ID from workflow
    let organizationId = eventData.organizationId;
    let userId = eventData.userId;
    
    if (workflowId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { organizationId: true, userId: true }
      });
      organizationId = workflow?.organizationId || organizationId;
      userId = workflow?.userId || userId;
    }

    if (!userId) {
      throw new Error('User ID is required to get promo code');
    }

    if (!action.batchId) {
      throw new Error('Batch ID is required');
    }

    // Verify batch exists and belongs to user
    const batch = await prisma.promoCodeBatch.findFirst({
      where: {
        id: action.batchId,
        userId: userId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    // Check if batch is active and valid
    const now = new Date();
    if (!batch.isActive) {
      throw new Error('Batch is not active');
    }

    if (batch.validFrom > now) {
      throw new Error('Batch is not yet valid');
    }

    if (batch.validUntil && batch.validUntil < now) {
      throw new Error('Batch has expired');
    }

    let promoCode;

    if (action.codeType === 'specific') {
      if (!action.specificCode) {
        throw new Error('Specific code is required');
      }

      // Get the specific code
      promoCode = await prisma.promoCode.findFirst({
        where: {
          batchId: action.batchId,
          code: action.specificCode.toUpperCase(),
          isUsed: false,
        },
      });

      if (!promoCode) {
        throw new Error('Specific code not found or already used');
      }
    } else if (action.codeType === 'sequential') {
      // Get the next available code (oldest unused)
      promoCode = await prisma.promoCode.findFirst({
        where: {
          batchId: action.batchId,
          isUsed: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } else {
      // Random code (default)
      // Get a random unused code
      const unusedCodes = await prisma.promoCode.findMany({
        where: {
          batchId: action.batchId,
          isUsed: false,
        },
      });

      if (unusedCodes.length === 0) {
        throw new Error('No unused codes available in this batch');
      }

      // Select a random code
      const randomIndex = Math.floor(Math.random() * unusedCodes.length);
      promoCode = unusedCodes[randomIndex];
    }

    if (!promoCode) {
      throw new Error('No available codes in this batch');
    }

    // Mark the code as used
    await prisma.promoCode.update({
      where: {
        id: promoCode.id,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: userId,
      },
    });

    // Update batch usage count
    await prisma.promoCodeBatch.update({
      where: {
        id: action.batchId,
      },
      data: {
        usedCodes: {
          increment: 1,
        },
      },
    });

    return {
      code: promoCode.code,
      batchId: action.batchId,
      batchName: batch.name,
      discountType: batch.discountType,
      discountValue: batch.discountValue,
      minOrderValue: batch.minOrderValue,
      outputVariable: action.outputVariable,
    };
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