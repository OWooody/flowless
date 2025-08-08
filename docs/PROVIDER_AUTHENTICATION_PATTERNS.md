# 🔐 Provider Authentication Patterns Guide

## **Overview**
This guide shows you how to configure different authentication patterns for WhatsApp providers. The system supports various authentication methods commonly used by different providers.

## **📍 File Location**
Provider configurations are located in:
```
app/lib/whatsapp/providers/factory.ts
```

## **🎯 Authentication Patterns**

### **1. Base URL + Bearer Token (Current Freshchat)**

This is the most common pattern for modern APIs:

```typescript
freshchat: {
  baseUrl: {
    type: 'url',
    label: 'API Base URL',
    required: true,
    placeholder: 'https://api.freshchat.com/v2',
    help: 'The base URL for your API endpoint'
  },
  bearerToken: {
    type: 'password',
    label: 'Bearer Token',
    required: true,
    placeholder: 'Enter your bearer token',
    help: 'Your bearer token for API authentication'
  }
}
```

**Usage**: `Authorization: Bearer <token>`

### **2. API Key + API Secret Pattern**

Traditional API key authentication:

```typescript
twilio: {
  accountSid: {
    type: 'text',
    label: 'Account SID',
    required: true,
    placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Your Twilio Account SID'
  },
  authToken: {
    type: 'password',
    label: 'Auth Token',
    required: true,
    placeholder: 'Enter your auth token',
    help: 'Your Twilio Auth Token'
  },
  phoneNumber: {
    type: 'text',
    label: 'WhatsApp Phone Number',
    required: true,
    placeholder: '+1234567890',
    help: 'Your WhatsApp Business phone number'
  }
}
```

**Usage**: Basic Auth with `accountSid:authToken`

### **3. API Key Only Pattern**

Simple API key authentication:

```typescript
messagebird: {
  apiKey: {
    type: 'password',
    label: 'API Key',
    required: true,
    placeholder: 'Enter your MessageBird API key',
    help: 'Your MessageBird API key from the dashboard'
  },
  channelId: {
    type: 'text',
    label: 'Channel ID',
    required: true,
    placeholder: 'Enter your WhatsApp channel ID',
    help: 'Your WhatsApp Business channel ID'
  }
}
```

**Usage**: `Authorization: AccessKey <apiKey>`

### **4. Username + Password Pattern**

Basic authentication:

```typescript
customProvider: {
  username: {
    type: 'text',
    label: 'Username',
    required: true,
    placeholder: 'Enter your username',
    help: 'Your account username'
  },
  password: {
    type: 'password',
    label: 'Password',
    required: true,
    placeholder: 'Enter your password',
    help: 'Your account password'
  },
  baseUrl: {
    type: 'url',
    label: 'API Base URL',
    required: true,
    placeholder: 'https://api.example.com',
    help: 'The base URL for your API'
  }
}
```

**Usage**: Basic Auth with `username:password`

### **5. Multiple API Keys Pattern**

Some providers use multiple keys:

```typescript
multiKeyProvider: {
  publicKey: {
    type: 'text',
    label: 'Public Key',
    required: true,
    placeholder: 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Your public API key'
  },
  privateKey: {
    type: 'password',
    label: 'Private Key',
    required: true,
    placeholder: 'Enter your private key',
    help: 'Your private API key (keep secret)'
  },
  webhookSecret: {
    type: 'password',
    label: 'Webhook Secret',
    required: false,
    placeholder: 'Enter webhook secret',
    help: 'Secret for webhook verification'
  }
}
```

### **6. OAuth2 Pattern**

For providers using OAuth2:

```typescript
oauthProvider: {
  clientId: {
    type: 'text',
    label: 'Client ID',
    required: true,
    placeholder: 'Enter your client ID',
    help: 'Your OAuth2 client ID'
  },
  clientSecret: {
    type: 'password',
    label: 'Client Secret',
    required: true,
    placeholder: 'Enter your client secret',
    help: 'Your OAuth2 client secret'
  },
  refreshToken: {
    type: 'password',
    label: 'Refresh Token',
    required: true,
    placeholder: 'Enter your refresh token',
    help: 'Your OAuth2 refresh token'
  },
  baseUrl: {
    type: 'url',
    label: 'API Base URL',
    required: true,
    placeholder: 'https://api.example.com',
    help: 'The base URL for your API'
  }
}
```

## **🔧 How to Add a New Provider**

### **Step 1: Add Provider Configuration**

Add your provider configuration to the factory:

```typescript
getProviderConfigFields(providerName: string): Record<string, any> {
  const configFields: Record<string, Record<string, any>> = {
    freshchat: {
      // ... existing freshchat config
    },
    yourProvider: {
      baseUrl: {
        type: 'url',
        label: 'API Base URL',
        required: true,
        placeholder: 'https://api.yourprovider.com',
        help: 'Your API base URL'
      },
      apiKey: {
        type: 'password',
        label: 'API Key',
        required: true,
        placeholder: 'Enter your API key',
        help: 'Your API key from the dashboard'
      }
    }
  };

  return configFields[providerName] || {};
}
```

### **Step 2: Create Provider Implementation**

Create a new provider file:

```typescript
// app/lib/whatsapp/providers/yourprovider.ts
import { 
  WhatsAppProvider, 
  WhatsAppProviderConfig, 
  WhatsAppTemplate, 
  WhatsAppMessage, 
  WhatsAppMessageResult 
} from './base';

export class YourProviderProvider implements WhatsAppProvider {
  private config: WhatsAppProviderConfig | null = null;
  private baseUrl: string = '';
  private apiKey: string = '';

  getName(): string {
    return 'yourprovider';
  }

  getDisplayName(): string {
    return 'Your Provider';
  }

  async configure(config: WhatsAppProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.credentials.baseUrl;
    this.apiKey = config.credentials.apiKey;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Implement other required methods...
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    // Your implementation
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResult> {
    // Your implementation
  }

  // ... other methods
}
```

### **Step 3: Register Provider**

Add your provider to the factory:

```typescript
import { YourProviderProvider } from './yourprovider';

export class WhatsAppProviderFactoryImpl implements WhatsAppProviderFactory {
  constructor() {
    this.registerProvider('freshchat', FreshchatProvider);
    this.registerProvider('yourprovider', YourProviderProvider); // Add this
  }
}
```

## **🎨 Field Type Options**

### **Text Input**
```typescript
{
  type: 'text',
  label: 'Field Label',
  required: true,
  placeholder: 'Enter value',
  help: 'Help text'
}
```

### **Password Input**
```typescript
{
  type: 'password',
  label: 'Password Field',
  required: true,
  placeholder: 'Enter password',
  help: 'Help text'
}
```

### **URL Input**
```typescript
{
  type: 'url',
  label: 'Website URL',
  required: true,
  placeholder: 'https://example.com',
  help: 'Must be a valid URL'
}
```

### **Select Dropdown**
```typescript
{
  type: 'select',
  label: 'Select Option',
  required: true,
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ],
  defaultValue: 'option1',
  help: 'Choose an option'
}
```

## **🔍 Validation Rules**

The system automatically validates:

- **Required Fields**: Must not be empty
- **URL Fields**: Must be valid URLs
- **Select Fields**: Must have a selected value if required
- **Password Fields**: Hidden input for security

## **🚀 Common Provider Examples**

### **Twilio WhatsApp**
```typescript
twilio: {
  accountSid: {
    type: 'text',
    label: 'Account SID',
    required: true,
    placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Your Twilio Account SID'
  },
  authToken: {
    type: 'password',
    label: 'Auth Token',
    required: true,
    placeholder: 'Enter your auth token',
    help: 'Your Twilio Auth Token'
  },
  phoneNumber: {
    type: 'text',
    label: 'WhatsApp Phone Number',
    required: true,
    placeholder: '+1234567890',
    help: 'Your WhatsApp Business phone number'
  }
}
```

### **MessageBird**
```typescript
messagebird: {
  apiKey: {
    type: 'password',
    label: 'API Key',
    required: true,
    placeholder: 'Enter your MessageBird API key',
    help: 'Your MessageBird API key'
  },
  channelId: {
    type: 'text',
    label: 'Channel ID',
    required: true,
    placeholder: 'Enter your WhatsApp channel ID',
    help: 'Your WhatsApp Business channel ID'
  }
}
```

### **Vonage (Nexmo)**
```typescript
vonage: {
  apiKey: {
    type: 'text',
    label: 'API Key',
    required: true,
    placeholder: 'Enter your Vonage API key',
    help: 'Your Vonage API key'
  },
  apiSecret: {
    type: 'password',
    label: 'API Secret',
    required: true,
    placeholder: 'Enter your API secret',
    help: 'Your Vonage API secret'
  },
  applicationId: {
    type: 'text',
    label: 'Application ID',
    required: true,
    placeholder: 'Enter your application ID',
    help: 'Your Vonage application ID'
  }
}
```

## **📝 Best Practices**

1. **Security**: Use `password` type for sensitive credentials
2. **Validation**: Use `url` type for base URLs
3. **Help Text**: Provide clear instructions for finding credentials
4. **Placeholders**: Show example formats when helpful
5. **Required Fields**: Mark essential fields as required
6. **Default Values**: Provide sensible defaults for select fields

## **🔧 Testing Your Provider**

After adding a new provider:

1. **Restart the server**: `npm run dev`
2. **Visit WhatsApp page**: Navigate to `/whatsapp`
3. **Test configuration**: Try configuring your new provider
4. **Verify validation**: Test required fields and validation
5. **Check API calls**: Ensure your provider implementation works

## **🚀 Next Steps**

Now you can:
1. **Add new providers** with different authentication patterns
2. **Customize existing providers** to match your needs
3. **Support multiple authentication methods** for the same provider
4. **Test different provider configurations** easily
5. **Extend the system** with new field types as needed

The provider system is now flexible enough to handle any authentication pattern your WhatsApp providers might use! 