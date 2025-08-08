import crypto from 'crypto';
import prisma from './prisma';
import { Prisma } from '@prisma/client';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

type WebhookWithEvents = Prisma.WebhookGetPayload<{
  select: {
    id: true;
    url: true;
    secret: true;
    isActive: true;
    events: true;
    failureCount: true;
    eventName: true;
    filterItemName: true;
    filterItemCategory: true;
    filterValue: true;
  };
}>;

export async function deliverWebhook(webhookId: string, payload: WebhookPayload) {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      select: {
        id: true,
        url: true,
        secret: true,
        isActive: true,
        failureCount: true,
        eventName: true,
      },
    });

    if (!webhook || !webhook.isActive) {
      return;
    }

    // Create signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: JSON.stringify(payload),
    });

    // Update webhook status
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggered: new Date(),
        failureCount: response.ok ? 0 : webhook.failureCount + 1,
      },
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error delivering webhook:', error);
    // Update failure count
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        failureCount: {
          increment: 1,
        },
      },
    });
  }
}

export async function triggerWebhooks(event: string, data: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event,
        },
        OR: [
          { eventName: data.name }, // Match specific event name
          { eventName: null },      // Or match all events
        ],
      },
    });

    // Filter webhooks based on item name, category, id, and value
    const filteredWebhooks = webhooks.filter(webhook => {
      const webhookWithFilters = webhook as any;
      
      // Check item name filter
      if (webhookWithFilters.filterItemName && data.itemName !== webhookWithFilters.filterItemName) {
        return false;
      }
      
      // Check item category filter
      if (webhookWithFilters.filterItemCategory && data.itemCategory !== webhookWithFilters.filterItemCategory) {
        return false;
      }
      
      // Check item id filter
      if (webhookWithFilters.filterItemId && data.itemId !== webhookWithFilters.filterItemId) {
        return false;
      }
      
      // Check value filter
      if (webhookWithFilters.filterValue !== null && webhookWithFilters.filterValue !== undefined && data.value !== webhookWithFilters.filterValue) {
        return false;
      }
      
      return true;
    });

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // Deliver to all matching webhooks
    await Promise.all(
      filteredWebhooks.map((webhook) => deliverWebhook(webhook.id, payload))
    );

    // NEW: Trigger workflows
    await triggerWorkflows(event, data);
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

/**
 * Trigger workflows based on an event
 */
async function triggerWorkflows(event: string, data: any) {
  try {
    // Import workflow service dynamically to avoid circular dependencies
    const { workflowService } = await import('./workflow');
    
    // Get workflows that should be triggered by this event
    const matchingWorkflows = await workflowService.getMatchingWorkflows(event, data);
    
    // Execute all matching workflows
    await Promise.all(
      matchingWorkflows.map(workflow => 
        workflowService.executeWorkflow(workflow.id, data)
      )
    );
  } catch (error) {
    console.error('Error triggering workflows:', error);
  }
} 