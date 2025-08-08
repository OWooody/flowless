import { 
  WhatsAppProvider, 
  WhatsAppProviderConfig, 
  WhatsAppTemplate, 
  WhatsAppMessage, 
  WhatsAppMessageResult 
} from './base';

export class FreshchatProvider implements WhatsAppProvider {
  private config: WhatsAppProviderConfig | null = null;
  private baseUrl: string = '';
  private bearerToken: string = '';

  getName(): string {
    return 'freshchat';
  }

  getDisplayName(): string {
    return 'Freshchat';
  }

  async configure(config: WhatsAppProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.credentials.baseUrl;
    this.bearerToken = config.credentials.bearerToken;
  }

  async testConnection(): Promise<boolean> {
    try {
      // According to Freshchat API docs, use /v2/accounts/configuration for connection test
      console.log(`Testing Freshchat connection with endpoint: ${this.baseUrl}/accounts/configuration`);
      
      const response = await fetch(`${this.baseUrl}/accounts/configuration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log(`Freshchat connection test response status:`, response.status);
      
      if (response.ok) {
        console.log(`Freshchat connection successful`);
        return true;
      } else {
        console.log(`Freshchat connection failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('Freshchat connection test failed:', error);
      return false;
    }
  }

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      // According to Freshchat API docs, WhatsApp templates are managed through outbound messages
      // For now, return empty array as Freshchat doesn't have a direct template listing endpoint
      // Templates are typically managed through the Freshchat dashboard
      console.log('Freshchat WhatsApp templates are managed through the dashboard, not via API');
      
      return [];
    } catch (error) {
      console.error('Failed to fetch Freshchat templates:', error);
      return [];
    }
  }

  async getTemplateByName(templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      console.log(`Fetching Freshchat template: ${templateName}`);
      
      // Try to get template by name using direct search
      const response = await fetch(`${this.baseUrl}/templates?name=${encodeURIComponent(templateName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log(`Freshchat template search response status:`, response.status);

      if (!response.ok) {
        console.log(`Template not found or API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('Freshchat template search response:', data);

      // Look for the template in the response
      const templates = data.templates || data.data || [];
      const template = templates.find((t: any) => t.name === templateName);

      if (!template) {
        console.log(`Template '${templateName}' not found in response`);
        return null;
      }

      // Extract variables from template content
      const variables = this.extractVariablesFromTemplate(template.content || template.text || '');

      return {
        id: template.id || templateName,
        templateName: template.name,
        displayName: template.displayName || template.name,
        category: template.category || 'general',
        language: template.language || 'en',
        variables: variables,
        isActive: template.status === 'APPROVED' || template.status === 'approved',
      };
    } catch (error) {
      console.error('Failed to fetch Freshchat template by name:', error);
      return null;
    }
  }

  private extractVariablesFromTemplate(content: string): any[] {
    try {
      console.log('Extracting variables from template content:', content);
      
      // Match variables in format {{1}}, {{2}}, {{variable_name}}, etc.
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const matches = content.match(variableRegex);
      
      if (!matches) {
        console.log('No variables found in template');
        return [];
      }

      const variables: any[] = [];
      const seenVariables = new Set<string>();

      matches.forEach((match, index) => {
        // Extract variable name from {{variable_name}}
        const variableName = match.replace(/\{\{|\}\}/g, '');
        
        // Avoid duplicates
        if (seenVariables.has(variableName)) {
          return;
        }
        seenVariables.add(variableName);

        // Determine if it's a numbered variable or named variable
        const isNumbered = /^\d+$/.test(variableName);
        
        variables.push({
          name: variableName,
          position: index + 1,
          required: true,
          type: 'string',
          description: isNumbered ? `Variable ${variableName}` : `Variable: ${variableName}`,
          isNumbered: isNumbered
        });
      });

      console.log('Extracted variables:', variables);
      return variables;
    } catch (error) {
      console.error('Error extracting variables from template:', error);
      return [];
    }
  }

  async createTemplate(template: Omit<WhatsAppTemplate, 'id'>): Promise<WhatsAppTemplate> {
    try {
      // According to Freshchat API docs, templates are managed through the dashboard
      // This method is not supported via API
      throw new Error('Template creation is not supported via Freshchat API. Please use the Freshchat dashboard.');
    } catch (error) {
      console.error('Failed to create Freshchat template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, template: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    try {
      // According to Freshchat API docs, templates are managed through the dashboard
      // This method is not supported via API
      throw new Error('Template updates are not supported via Freshchat API. Please use the Freshchat dashboard.');
    } catch (error) {
      console.error('Failed to update Freshchat template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      // According to Freshchat API docs, templates are managed through the dashboard
      // This method is not supported via API
      throw new Error('Template deletion is not supported via Freshchat API. Please use the Freshchat dashboard.');
    } catch (error) {
      console.error('Failed to delete Freshchat template:', error);
      throw error;
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResult> {
    try {
      console.log('📤 Sending Freshchat message:', {
        baseUrl: this.baseUrl,
        from: message.from,
        to: message.to,
        templateName: message.templateName,
        variables: message.variables
      });

      // Convert variables to Freshchat format
      const bodyParams: Array<{ data: string }> = [];
      if (message.variables && typeof message.variables === 'object') {
        // Add variables in order (1, 2, 3, etc.)
        Object.keys(message.variables).forEach(key => {
          if (key.match(/^\d+$/)) { // Only numbered variables for body
            bodyParams.push({
              data: message.variables![key]
            });
          }
        });
      }

      // According to Freshchat API docs, use the correct format
      const requestBody = {
        from: {
          phone_number: message.from
        },
        provider: "whatsapp",
        to: [
          {
            phone_number: message.to
          }
        ],
        data: {
          message_template: {
            storage: "none",
            template_name: message.templateName,
            namespace: message.namespace || "",
            language: {
              policy: "deterministic",
              code: message.language || "ar"
            },
            rich_template_data: {
              body: {
                params: bodyParams
              }
            }
          }
        }
      };

      const url = `${this.baseUrl}/outbound-messages/whatsapp`;
      console.log('🌐 Freshchat URL:', url);
      console.log('📨 Freshchat request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Freshchat response status:', response.status);
      console.log('📡 Freshchat response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Freshchat error response:', errorData);
        return {
          success: false,
          error: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log('✅ Freshchat success response:', data);
      
      return {
        success: true,
        messageId: data.id,
        status: data.status,
      };
    } catch (error) {
      console.error('❌ Failed to send Freshchat message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<WhatsAppMessageResult[]> {
    const results: WhatsAppMessageResult[] = [];
    
    for (const message of messages) {
      // Add delay between messages to respect rate limits
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const result = await this.sendMessage(message);
      results.push(result);
    }
    
    return results;
  }

  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    // Implement webhook signature validation for Freshchat
    // This would typically involve HMAC validation
    if (!this.config?.webhookSecret) {
      return false;
    }

    // Simple validation - in production, implement proper HMAC validation
    return signature === this.config.webhookSecret;
  }

  async processWebhook(payload: any): Promise<void> {
    // Process webhook payload from Freshchat
    // This would typically update message status, handle delivery receipts, etc.
    console.log('Processing Freshchat webhook:', payload);
    
    // TODO: Implement webhook processing logic
    // - Update message delivery status
    // - Handle user responses
    // - Process opt-outs
  }
} 