import prisma from '../../lib/prisma';
import { smsProviderFactory } from './providers/factory';
import { SMSProvider, SMSMessage, SMSMessageResult, SMSTemplate } from './providers/base';

export class SMSService {
  private providerInstances = new Map<string, SMSProvider>();

  private async getProviderInstance(organizationId: string): Promise<SMSProvider> {
    if (this.providerInstances.has(organizationId)) {
      return this.providerInstances.get(organizationId)!;
    }

    const provider = await this.getProvider(organizationId);
    if (!provider) {
      throw new Error('No SMS provider configured');
    }

    const providerInstance = smsProviderFactory.createProvider(provider.providerName);
    await providerInstance.configure({
      id: provider.id,
      organizationId: provider.organizationId,
      providerName: provider.providerName,
      displayName: provider.displayName,
      credentials: provider.credentials,
      config: provider.config,
      webhookUrl: provider.webhookUrl || undefined,
      webhookSecret: provider.webhookSecret || undefined,
    });

    this.providerInstances.set(organizationId, providerInstance);
    return providerInstance;
  }

  async createProvider(organizationId: string, providerData: {
    providerName: string;
    displayName: string;
    credentials: any;
    config?: any;
    webhookUrl?: string;
    webhookSecret?: string;
  }) {
    // Validate provider configuration
    const validation = smsProviderFactory.validateProviderConfig(
      providerData.providerName,
      providerData.credentials
    );

    if (!validation.isValid) {
      throw new Error(`Invalid provider configuration: ${validation.errors.join(', ')}`);
    }

    // Test connection
    const providerInstance = smsProviderFactory.createProvider(providerData.providerName);
    await providerInstance.configure({
      id: '',
      organizationId,
      providerName: providerData.providerName,
      displayName: providerData.displayName,
      credentials: providerData.credentials,
      config: providerData.config,
      webhookUrl: providerData.webhookUrl,
      webhookSecret: providerData.webhookSecret,
    });

    // For development/testing, allow skipping connection test
    const skipConnectionTest = process.env.NODE_ENV === 'development' && 
      (providerData.credentials.skipConnectionTest === true || 
       providerData.credentials.testMode === 'true' ||
       providerData.credentials.baseUrl?.includes('test') ||
       providerData.credentials.baseUrl?.includes('localhost'));

    if (!skipConnectionTest) {
      const isConnected = await providerInstance.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to SMS provider. Please check your credentials.');
      }
    } else {
      console.log('Skipping connection test for development/testing');
    }

    // Deactivate existing providers for this organization
    await prisma.sMSProvider.updateMany({
      where: { organizationId },
      data: { isActive: false },
    });

    // Create new provider
    const provider = await prisma.sMSProvider.create({
      data: {
        organizationId,
        providerName: providerData.providerName,
        displayName: providerData.displayName,
        credentials: providerData.credentials,
        config: providerData.config,
        webhookUrl: providerData.webhookUrl,
        webhookSecret: providerData.webhookSecret,
        isActive: true,
      },
    });

    return provider;
  }

  async getProvider(organizationId: string) {
    return await prisma.sMSProvider.findFirst({
      where: { organizationId, isActive: true },
    });
  }

  async updateProvider(organizationId: string, providerId: string, updates: {
    displayName?: string;
    credentials?: any;
    config?: any;
    webhookUrl?: string;
    webhookSecret?: string;
  }) {
    const provider = await prisma.sMSProvider.findFirst({
      where: { id: providerId, organizationId },
    });

    if (!provider) {
      throw new Error('SMS provider not found');
    }

    // If credentials are being updated, validate them
    if (updates.credentials) {
      const validation = smsProviderFactory.validateProviderConfig(
        provider.providerName,
        updates.credentials
      );

      if (!validation.isValid) {
        throw new Error(`Invalid provider configuration: ${validation.errors.join(', ')}`);
      }

      // Test connection with new credentials
      const providerInstance = smsProviderFactory.createProvider(provider.providerName);
      await providerInstance.configure({
        id: provider.id,
        organizationId: provider.organizationId,
        providerName: provider.providerName,
        displayName: provider.displayName,
        credentials: updates.credentials,
        config: updates.config || provider.config,
        webhookUrl: updates.webhookUrl || provider.webhookUrl || undefined,
        webhookSecret: updates.webhookSecret || provider.webhookSecret || undefined,
      });

      const isConnected = await providerInstance.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to SMS provider with new credentials.');
      }
    }

    // Update provider
    const updatedProvider = await prisma.sMSProvider.update({
      where: { id: providerId },
      data: updates,
    });

    // Clear cached instance
    this.providerInstances.delete(organizationId);

    return updatedProvider;
  }

  async deleteProvider(organizationId: string, providerId: string) {
    const provider = await prisma.sMSProvider.findFirst({
      where: { id: providerId, organizationId },
    });

    if (!provider) {
      throw new Error('SMS provider not found');
    }

    await prisma.sMSProvider.delete({
      where: { id: providerId },
    });

    // Clear cached instance
    this.providerInstances.delete(organizationId);
  }

  async syncTemplates(organizationId: string) {
    const provider = await this.getProviderInstance(organizationId);
    const templates = await provider.getTemplates();

    // Get the SMS provider record to get the provider ID
    const smsProvider = await this.getProvider(organizationId);
    if (!smsProvider) {
      throw new Error('No SMS provider found for this organization');
    }

    // Clear existing templates for this organization
    await prisma.sMSTemplate.deleteMany({
      where: { organizationId },
    });

    // Create new templates
    const createdTemplates = [];
    for (const template of templates) {
      const createdTemplate = await prisma.sMSTemplate.create({
        data: {
          providerId: smsProvider.id,
          organizationId,
          templateName: template.templateName,
          displayName: template.displayName,
          category: template.category,
          language: template.language,
          variables: template.variables,
          isActive: template.isActive,
        },
      });
      createdTemplates.push(createdTemplate);
    }

    return createdTemplates;
  }

  async getTemplates(organizationId: string): Promise<SMSTemplate[]> {
    const templates = await prisma.sMSTemplate.findMany({
      where: { organizationId, isActive: true },
      orderBy: { displayName: 'asc' },
    });

    return templates.map(template => ({
      id: template.id,
      templateName: template.templateName,
      displayName: template.displayName,
      category: template.category,
      language: template.language,
      variables: template.variables,
      isActive: template.isActive,
    }));
  }

  async getTemplateByName(organizationId: string, templateName: string): Promise<SMSTemplate | null> {
    const template = await prisma.sMSTemplate.findFirst({
      where: { organizationId, templateName, isActive: true },
    });

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      templateName: template.templateName,
      displayName: template.displayName,
      category: template.category,
      language: template.language,
      variables: template.variables,
      isActive: template.isActive,
    };
  }

  async sendMessage(organizationId: string, message: SMSMessage): Promise<SMSMessageResult> {
    const provider = await this.getProviderInstance(organizationId);
    return await provider.sendMessage(message);
  }

  async sendBulkMessages(organizationId: string, messages: SMSMessage[]): Promise<SMSMessageResult[]> {
    const provider = await this.getProviderInstance(organizationId);
    return await provider.sendBulkMessages(messages);
  }

  async getUserPhones(userId: string, organizationId?: string) {
    const whereClause: any = { userId };
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    return await prisma.userPhone.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async addUserPhone(userId: string, phoneData: {
    phoneNumber: string;
    countryCode: string;
    organizationId?: string;
  }) {
    return await prisma.userPhone.create({
      data: {
        userId,
        phoneNumber: phoneData.phoneNumber,
        countryCode: phoneData.countryCode,
        organizationId: phoneData.organizationId,
        isOptedIn: true, // Default to opted in for SMS
      },
    });
  }

  async updateUserPhoneOptIn(userId: string, phoneNumber: string, isOptedIn: boolean) {
    return await prisma.userPhone.updateMany({
      where: { userId, phoneNumber },
      data: { isOptedIn },
    });
  }

  getAvailableProviders() {
    return smsProviderFactory.getAvailableProviders().map(providerName => ({
      name: providerName,
      displayName: smsProviderFactory.getProviderDisplayName(providerName),
    }));
  }

  async testConnection(organizationId: string): Promise<boolean> {
    try {
      const provider = await this.getProviderInstance(organizationId);
      return await provider.testConnection();
    } catch (error) {
      console.error('Error testing SMS provider connection:', error);
      return false;
    }
  }
} 