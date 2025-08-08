export interface SMSProviderConfig {
  id: string;
  organizationId: string;
  providerName: string;
  displayName: string;
  credentials: any;
  config?: any;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface SMSTemplate {
  id: string;
  templateName: string;
  displayName: string;
  category: string;
  language: string;
  variables?: any;
  isActive: boolean;
}

export interface SMSMessage {
  from?: string; // Make from optional for providers like Unifonic
  to: string;
  templateName?: string;
  message?: string;
  variables?: Record<string, string>;
  language?: string;
}

export interface SMSMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

export interface SMSProvider {
  // Provider identification
  getName(): string;
  getDisplayName(): string;
  
  // Configuration
  configure(config: SMSProviderConfig): Promise<void>;
  testConnection(): Promise<boolean>;
  
  // Template management
  getTemplates(): Promise<SMSTemplate[]>;
  createTemplate(template: Omit<SMSTemplate, 'id'>): Promise<SMSTemplate>;
  updateTemplate(id: string, template: Partial<SMSTemplate>): Promise<SMSTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Message sending
  sendMessage(message: SMSMessage): Promise<SMSMessageResult>;
  sendBulkMessages(messages: SMSMessage[]): Promise<SMSMessageResult[]>;
  
  // Webhook handling
  validateWebhook(payload: any, signature: string): Promise<boolean>;
  processWebhook(payload: any): Promise<void>;
}

export interface SMSProviderFactory {
  createProvider(providerName: string): SMSProvider;
  getAvailableProviders(): string[];
  getProviderDisplayName(providerName: string): string;
  validateProviderConfig(providerName: string, credentials: any): {
    isValid: boolean;
    errors: string[];
  };
} 