export interface WhatsAppProviderConfig {
  id: string;
  organizationId: string;
  providerName: string;
  displayName: string;
  credentials: any;
  config?: any;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface WhatsAppTemplate {
  id: string;
  templateName: string;
  displayName: string;
  category: string;
  language: string;
  variables?: any;
  isActive: boolean;
}

export interface WhatsAppMessage {
  from: string;
  to: string;
  templateName: string;
  namespace?: string; // Optional for backward compatibility
  variables?: Record<string, string>;
  language?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

export interface WhatsAppProvider {
  // Provider identification
  getName(): string;
  getDisplayName(): string;
  
  // Configuration
  configure(config: WhatsAppProviderConfig): Promise<void>;
  testConnection(): Promise<boolean>;
  
  // Template management
  getTemplates(): Promise<WhatsAppTemplate[]>;
  createTemplate(template: Omit<WhatsAppTemplate, 'id'>): Promise<WhatsAppTemplate>;
  updateTemplate(id: string, template: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Message sending
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResult>;
  sendBulkMessages(messages: WhatsAppMessage[]): Promise<WhatsAppMessageResult[]>;
  
  // Webhook handling
  validateWebhook(payload: any, signature: string): Promise<boolean>;
  processWebhook(payload: any): Promise<void>;
}

export interface WhatsAppProviderFactory {
  createProvider(providerName: string): WhatsAppProvider;
  getAvailableProviders(): string[];
  getProviderDisplayName(providerName: string): string;
} 