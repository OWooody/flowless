import prisma from '../../lib/prisma';
import { whatsappProviderFactory } from './providers/factory';
import { WhatsAppProvider, WhatsAppMessage, WhatsAppMessageResult, WhatsAppTemplate } from './providers/base';

export class WhatsAppService {
  private providerInstances = new Map<string, WhatsAppProvider>();

  private async getProviderInstance(organizationId: string): Promise<WhatsAppProvider> {
    if (this.providerInstances.has(organizationId)) {
      return this.providerInstances.get(organizationId)!;
    }

    const provider = await this.getProvider(organizationId);
    if (!provider) {
      throw new Error('No WhatsApp provider configured');
    }

    const providerInstance = whatsappProviderFactory.createProvider(provider.providerName);
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
    const validation = whatsappProviderFactory.validateProviderConfig(
      providerData.providerName,
      providerData.credentials
    );

    if (!validation.isValid) {
      throw new Error(`Invalid provider configuration: ${validation.errors.join(', ')}`);
    }

    // Test connection
    const providerInstance = whatsappProviderFactory.createProvider(providerData.providerName);
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
        throw new Error('Failed to connect to WhatsApp provider. Please check your credentials.');
      }
    } else {
      console.log('Skipping connection test for development/testing');
    }

    // Deactivate existing providers for this organization
    await prisma.whatsAppProvider.updateMany({
      where: { organizationId },
      data: { isActive: false },
    });

    // Create new provider
    const provider = await prisma.whatsAppProvider.create({
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

    // Sync templates from provider
    await this.syncTemplates(organizationId);

    return provider;
  }

  async getProvider(organizationId: string) {
    return await prisma.whatsAppProvider.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
    });
  }

  async updateProvider(organizationId: string, providerId: string, updates: {
    displayName?: string;
    credentials?: any;
    config?: any;
    webhookUrl?: string;
    webhookSecret?: string;
  }) {
    const provider = await prisma.whatsAppProvider.findFirst({
      where: {
        id: providerId,
        organizationId,
      },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // If credentials are being updated, validate and test them
    if (updates.credentials) {
      const validation = whatsappProviderFactory.validateProviderConfig(
        provider.providerName,
        updates.credentials
      );

      if (!validation.isValid) {
        throw new Error(`Invalid provider configuration: ${validation.errors.join(', ')}`);
      }

      // Test connection with new credentials
      const providerInstance = whatsappProviderFactory.createProvider(provider.providerName);
      await providerInstance.configure({
        id: provider.id,
        organizationId,
        providerName: provider.providerName,
        displayName: provider.displayName,
        credentials: updates.credentials,
        config: updates.config || provider.config,
        webhookUrl: (updates.webhookUrl || provider.webhookUrl) || undefined,
        webhookSecret: (updates.webhookSecret || provider.webhookSecret) || undefined,
      });

      const isConnected = await providerInstance.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to WhatsApp provider with new credentials.');
      }
    }

    return await prisma.whatsAppProvider.update({
      where: { id: providerId },
      data: updates,
    });
  }

  async deleteProvider(organizationId: string, providerId: string) {
    const provider = await prisma.whatsAppProvider.findFirst({
      where: {
        id: providerId,
        organizationId,
      },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Delete associated templates
    await prisma.whatsAppTemplate.deleteMany({
      where: { providerId },
    });

    // Delete provider
    await prisma.whatsAppProvider.delete({
      where: { id: providerId },
    });
  }

  async syncTemplates(organizationId: string) {
    const providerInstance = await this.getProviderInstance(organizationId);
    const provider = await this.getProvider(organizationId);

    if (!provider) {
      throw new Error('No active WhatsApp provider found');
    }

    const templates = await providerInstance.getTemplates();

    // Clear existing templates
    await prisma.whatsAppTemplate.deleteMany({
      where: { providerId: provider.id },
    });

    // Create new templates
    const createdTemplates = await Promise.all(
      templates.map(template =>
        prisma.whatsAppTemplate.create({
          data: {
            providerId: provider.id,
            organizationId,
            templateName: template.templateName,
            displayName: template.displayName,
            category: template.category,
            language: template.language,
            variables: template.variables,
            isActive: template.isActive,
          },
        })
      )
    );

    return createdTemplates;
  }

  async getTemplates(organizationId: string): Promise<WhatsAppTemplate[]> {
    try {
      const provider = await this.getProvider(organizationId);
      if (!provider) {
        throw new Error('No WhatsApp provider configured');
      }

      const providerInstance = await this.getProviderInstance(organizationId);
      return await providerInstance.getTemplates();
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      throw error;
    }
  }

  async getTemplateByName(organizationId: string, templateName: string): Promise<WhatsAppTemplate | null> {
    try {
      const provider = await this.getProvider(organizationId);
      if (!provider) {
        throw new Error('No WhatsApp provider configured');
      }

      const providerInstance = await this.getProviderInstance(organizationId);
      const templates = await providerInstance.getTemplates();
      return templates.find(template => template.templateName === templateName) || null;
    } catch (error) {
      console.error('Error fetching WhatsApp template by name:', error);
      throw error;
    }
  }

  async sendMessage(organizationId: string, message: WhatsAppMessage): Promise<WhatsAppMessageResult> {
    const providerInstance = await this.getProviderInstance(organizationId);
    return await providerInstance.sendMessage(message);
  }

  async sendBulkMessages(organizationId: string, messages: WhatsAppMessage[]): Promise<WhatsAppMessageResult[]> {
    const providerInstance = await this.getProviderInstance(organizationId);
    return await providerInstance.sendBulkMessages(messages);
  }

  async getUserPhones(userId: string, organizationId?: string) {
    return await prisma.userPhone.findMany({
      where: {
        userId,
        ...(organizationId && { organizationId }),
        isOptedIn: true,
      },
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
        isOptedIn: true,
        optInDate: new Date(),
      },
    });
  }

  async updateUserPhoneOptIn(userId: string, phoneNumber: string, isOptedIn: boolean) {
    return await prisma.userPhone.updateMany({
      where: {
        userId,
        phoneNumber,
      },
      data: {
        isOptedIn,
        optInDate: isOptedIn ? new Date() : null,
        optOutDate: isOptedIn ? null : new Date(),
      },
    });
  }

  getAvailableProviders() {
    return whatsappProviderFactory.getAvailableProviders().map(providerName => ({
      name: providerName,
      displayName: whatsappProviderFactory.getProviderDisplayName(providerName),
      configFields: whatsappProviderFactory.getProviderConfigFields(providerName),
    }));
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService(); 