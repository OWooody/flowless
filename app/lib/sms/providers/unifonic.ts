import { SMSProvider, SMSProviderConfig, SMSMessage, SMSMessageResult, SMSTemplate } from './base';

export class UnifonicSMSProvider implements SMSProvider {
  private config: SMSProviderConfig | null = null;
  private baseUrl: string = 'https://el.cloud.unifonic.com';
  private apiKey: string = '';
  private isDevelopment: boolean = false;

  getName(): string {
    return 'unifonic';
  }

  getDisplayName(): string {
    return 'Unifonic SMS';
  }

  async configure(config: SMSProviderConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.credentials.apiKey;
    
    // Set base URL based on environment
    if (config.credentials.baseUrl) {
      this.baseUrl = config.credentials.baseUrl;
    }
    
    // Check if we're in development mode
    this.isDevelopment = process.env.NODE_ENV === 'development' || 
      config.credentials.skipConnectionTest === true ||
      config.credentials.testMode === 'true';
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Provider not configured');
    }

    // Skip connection test in development mode
    if (this.isDevelopment) {
      console.log('Unifonic: Skipping connection test in development mode');
      return true;
    }

    try {
      // Test the connection by making a simple API call
      // Unifonic typically uses a balance check or account info endpoint
      const response = await fetch(`${this.baseUrl}/rest/SMS/account/getBalance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'AppSid': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.success === true;
      }
      
      return false;
    } catch (error) {
      console.error('Unifonic connection test failed:', error);
      return false;
    }
  }

  async getTemplates(): Promise<SMSTemplate[]> {
    // Unifonic doesn't have built-in templates like WhatsApp
    // You could implement a custom template system
    return [];
  }

  async createTemplate(template: Omit<SMSTemplate, 'id'>): Promise<SMSTemplate> {
    // Implement custom template creation
    return {
      id: `template_${Date.now()}`,
      ...template
    };
  }

  async updateTemplate(id: string, template: Partial<SMSTemplate>): Promise<SMSTemplate> {
    // Implement template update
    return {
      id,
      templateName: template.templateName || '',
      displayName: template.displayName || '',
      category: template.category || '',
      language: template.language || '',
      variables: template.variables,
      isActive: template.isActive ?? true
    };
  }

  async deleteTemplate(id: string): Promise<void> {
    // Implement template deletion
    console.log('Deleting template:', id);
  }

  async sendMessage(message: SMSMessage): Promise<SMSMessageResult> {
    if (!this.config) {
      throw new Error('Provider not configured');
    }

    try {
      let messageBody = message.message || '';

      // If using a template, replace variables
      if (message.templateName && message.variables) {
        messageBody = this.replaceTemplateVariables(messageBody, message.variables);
      }

      // Prepare Unifonic API request with form data
      const formData = new URLSearchParams();
      formData.append('AppSid', this.apiKey);
      formData.append('Recipient', message.to.replace(/^\+/, '')); // Remove + if present
      formData.append('Body', messageBody);
      formData.append('SenderID', message.from || this.config.credentials.senderId || 'Unifonic');

      const apiUrl = `${this.baseUrl}/rest/SMS/messages`;



      // Send via Unifonic API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });



      console.log('📱 Unifonic API response status:', response.status);
      console.log('📱 Unifonic API response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.log('📱 Unifonic API error response:', responseText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
          status: 'failed',
        };
      }
      console.log('📱 Unifonic API response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.log('📱 Failed to parse JSON response:', parseError);
        return {
          success: false,
          error: `Invalid JSON response: ${responseText}`,
          status: 'failed',
        };
      }

      // Handle nested response structure from our API
      if (result.success === true && result.result) {
        // Our API wrapper returned success, but check the actual Unifonic response
        const unifonicResult = result.result;
        
        if (unifonicResult.success === true) {
          return {
            success: true,
            messageId: unifonicResult.messageId || `unifonic_${Date.now()}`,
            status: 'sent',
          };
        } else {
          return {
            success: false,
            error: unifonicResult.error || 'Failed to send SMS via Unifonic',
            status: 'failed',
          };
        }
      } else if (result.success === true) {
        // Direct Unifonic API response (no nesting)
        return {
          success: true,
          messageId: result.data?.MessageID || `unifonic_${Date.now()}`,
          status: 'sent',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send SMS via Unifonic',
          status: 'failed',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
        status: 'failed',
      };
    }
  }

  async sendBulkMessages(messages: SMSMessage[]): Promise<SMSMessageResult[]> {
    const results: SMSMessageResult[] = [];

    for (const message of messages) {
      const result = await this.sendMessage(message);
      results.push(result);
    }

    return results;
  }

  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    // Implement Unifonic webhook validation
    // Unifonic may use specific signature validation
    return true; // Simplified for now
  }

  async processWebhook(payload: any): Promise<void> {
    // Process incoming webhook from Unifonic
    console.log('Processing Unifonic webhook:', payload);
    
    // Handle delivery receipts
    if (payload.status) {
      console.log(`Message ${payload.messageId} status: ${payload.status}`);
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }

  // Additional Unifonic-specific methods
  async getBalance(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/SMS/account/getBalance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'AppSid': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.balance || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting Unifonic balance:', error);
      return 0;
    }
  }

  async getMessageStatus(messageId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/messages/getMessageIDStatus?MessageID=${messageId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'AppSid': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.status || 'unknown';
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error getting message status:', error);
      return 'unknown';
    }
  }
} 