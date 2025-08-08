import { WhatsAppProvider, WhatsAppProviderFactory } from './base';
import { FreshchatProvider } from './freshchat';

export class WhatsAppProviderFactoryImpl implements WhatsAppProviderFactory {
  private providers: Map<string, new () => WhatsAppProvider> = new Map();

  constructor() {
    // Register available providers
    this.registerProvider('freshchat', FreshchatProvider);
    
    // Future providers can be added here:
    // this.registerProvider('twilio', TwilioProvider);
    // this.registerProvider('messagebird', MessageBirdProvider);
  }

  private registerProvider(name: string, providerClass: new () => WhatsAppProvider): void {
    this.providers.set(name, providerClass);
  }

  createProvider(providerName: string): WhatsAppProvider {
    const ProviderClass = this.providers.get(providerName);
    
    if (!ProviderClass) {
      throw new Error(`Unknown WhatsApp provider: ${providerName}`);
    }

    return new ProviderClass();
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderDisplayName(providerName: string): string {
    try {
      const provider = this.createProvider(providerName);
      return provider.getDisplayName();
    } catch (error) {
      return providerName;
    }
  }

  getProviderConfigFields(providerName: string): Record<string, any> {
    const configFields: Record<string, Record<string, any>> = {
      freshchat: {
        baseUrl: {
          type: 'url',
          label: 'API Base URL',
          required: true,
          placeholder: 'https://your-account.freshchat.com/v2',
          help: 'Your Freshchat account URL (e.g., https://your-account.freshchat.com/v2)'
        },
        bearerToken: {
          type: 'password',
          label: 'Bearer Token',
          required: true,
          placeholder: 'Enter your bearer token',
          help: 'Your bearer token for API authentication'
        },
        webhookUrl: {
          type: 'url',
          label: 'Webhook URL (Optional)',
          required: false,
          placeholder: 'https://your-domain.com/api/webhooks/whatsapp',
          help: 'Webhook URL for delivery receipts and user responses'
        },
        webhookSecret: {
          type: 'password',
          label: 'Webhook Secret (Optional)',
          required: false,
          placeholder: 'Enter webhook secret for verification',
          help: 'Secret key for webhook signature verification'
        },
        environment: {
          type: 'select',
          label: 'Environment',
          required: true,
          options: [
            { value: 'production', label: 'Production' },
            { value: 'staging', label: 'Staging' },
            { value: 'development', label: 'Development' }
          ],
          defaultValue: 'production',
          help: 'Select your Freshchat environment'
        },
        region: {
          type: 'select',
          label: 'Region',
          required: false,
          options: [
            { value: 'us', label: 'United States' },
            { value: 'eu', label: 'Europe' },
            { value: 'in', label: 'India' }
          ],
          defaultValue: 'us',
          help: 'Select your Freshchat region (optional)'
        },
        testMode: {
          type: 'select',
          label: 'Test Mode',
          required: false,
          options: [
            { value: 'false', label: 'Production Mode' },
            { value: 'true', label: 'Test Mode (Skip Connection Test)' }
          ],
          defaultValue: 'false',
          help: 'Enable test mode to skip connection testing during development'
        }
      },
      // Future providers can be added here:
      // twilio: {
      //   accountSid: { type: 'text', label: 'Account SID', required: true },
      //   authToken: { type: 'password', label: 'Auth Token', required: true },
      //   phoneNumber: { type: 'text', label: 'WhatsApp Phone Number', required: true }
      // }
    };

    return configFields[providerName] || {};
  }

  validateProviderConfig(providerName: string, config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fields = this.getProviderConfigFields(providerName);

    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      if (fieldConfig.required && (!config[fieldName] || config[fieldName].trim() === '')) {
        errors.push(`${fieldConfig.label} is required`);
      }

      if (fieldConfig.type === 'url' && config[fieldName] && !this.isValidUrl(config[fieldName])) {
        errors.push(`${fieldConfig.label} must be a valid URL`);
      }

      if (fieldConfig.type === 'select' && fieldConfig.required && (!config[fieldName] || config[fieldName] === '')) {
        errors.push(`${fieldConfig.label} is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const whatsappProviderFactory = new WhatsAppProviderFactoryImpl(); 