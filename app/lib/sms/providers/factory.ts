import { SMSProvider, SMSProviderFactory } from './base';
import { TwilioSMSProvider } from './twilio';
import { UnifonicSMSProvider } from './unifonic';

export class SMSProviderFactoryImpl implements SMSProviderFactory {
  private providers = new Map<string, new () => SMSProvider>();

  constructor() {
    // Register available providers
    this.providers.set('twilio', TwilioSMSProvider);
    this.providers.set('unifonic', UnifonicSMSProvider);
    // Add more providers here as needed
    // this.providers.set('nexmo', NexmoSMSProvider);
    // this.providers.set('aws_sns', AWSSNSProvider);
  }

  createProvider(providerName: string): SMSProvider {
    const ProviderClass = this.providers.get(providerName);
    if (!ProviderClass) {
      throw new Error(`Unknown SMS provider: ${providerName}`);
    }
    return new ProviderClass();
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderDisplayName(providerName: string): string {
    const provider = this.createProvider(providerName);
    return provider.getDisplayName();
  }

  validateProviderConfig(providerName: string, credentials: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const provider = this.createProvider(providerName);
      
      // Provider-specific validation
      switch (providerName) {
        case 'twilio':
          if (!credentials.accountSid) {
            errors.push('Account SID is required');
          }
          if (!credentials.authToken) {
            errors.push('Auth Token is required');
          }
          if (!credentials.fromNumber) {
            errors.push('From Number is required');
          }
          break;
        case 'unifonic':
          if (!credentials.apiKey) {
            errors.push('API Key (AppSid) is required');
          }
          if (!credentials.senderId) {
            errors.push('Sender ID is required');
          }
          break;
        
        // Add validation for other providers
        default:
          errors.push(`No validation rules defined for provider: ${providerName}`);
      }
    } catch (error: any) {
      errors.push(`Invalid provider: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const smsProviderFactory = new SMSProviderFactoryImpl(); 