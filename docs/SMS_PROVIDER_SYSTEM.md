# SMS Provider System

## Overview

The SMS Provider System is a general, extensible framework for integrating multiple SMS service providers into the workflow system. Similar to the WhatsApp provider system, it allows you to easily add new SMS providers while maintaining a consistent interface.

## 🏗️ Architecture

### **Core Components**

1. **Base Interfaces** (`app/lib/sms/providers/base.ts`)
   - `SMSProvider` - Interface for SMS providers
   - `SMSProviderConfig` - Configuration structure
   - `SMSMessage` - Message structure
   - `SMSMessageResult` - Result structure
   - `SMSTemplate` - Template structure

2. **Provider Factory** (`app/lib/sms/providers/factory.ts`)
   - `SMSProviderFactory` - Manages provider registration
   - Provider validation and creation
   - Available providers listing

3. **SMS Service** (`app/lib/sms/service.ts`)
   - `SMSService` - Main service for SMS operations
   - Provider management
   - Message sending
   - Template management

4. **Provider Implementations**
   - `TwilioSMSProvider` - Twilio SMS integration
   - Extensible for other providers

## 🎯 Features

### **✅ Multi-Provider Support**
- **Twilio** - Primary SMS provider
- **Unifonic** - Middle East focused SMS provider
- **Vonage (Nexmo)** - Ready for implementation
- **AWS SNS** - Ready for implementation
- **Custom providers** - Easy to add

### **✅ Workflow Integration**
- **SMS Node** - Visual workflow component
- **Dynamic variables** - Support for `{event.userPhone}`
- **Template support** - Message templates
- **Bulk messaging** - Send to multiple recipients

### **✅ Provider Management**
- **Provider configuration** - Credentials and settings
- **Connection testing** - Verify provider setup
- **Template synchronization** - Sync templates from providers
- **Webhook support** - Delivery receipts

## 🔧 Database Schema

### **SMSProvider Model**
```sql
model SMSProvider {
  id             String   @id @default(cuid())
  organizationId String
  providerName   String   // 'twilio', 'nexmo', 'aws_sns', etc.
  displayName    String   // Human-readable provider name
  isActive       Boolean  @default(true)
  credentials    Json     // Encrypted provider credentials
  config         Json?    // Provider-specific configuration
  webhookUrl     String?  // Webhook URL for delivery receipts
  webhookSecret  String?  // Webhook secret for verification
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  templates      SMSTemplate[]

  @@index([organizationId])
  @@index([providerName])
  @@index([isActive])
  @@index([createdAt])
}
```

### **SMSTemplate Model**
```sql
model SMSTemplate {
  id             String   @id @default(cuid())
  providerId     String
  organizationId String
  templateName   String   // Template name/ID from provider
  displayName    String   // Human-readable template name
  category       String   // 'marketing', 'transactional', 'support', etc.
  language       String   @default("en")
  variables      Json?    // Template variables and their types
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  provider       SMSProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId])
  @@index([organizationId])
  @@index([templateName])
  @@index([category])
  @@index([language])
  @@index([isActive])
  @@index([createdAt])
}
```

## 🚀 Usage Examples

### **1. Creating a Provider**
```javascript
const smsService = new SMSService();

// Twilio Provider
const twilioProvider = await smsService.createProvider('org_123', {
  providerName: 'twilio',
  displayName: 'Twilio SMS',
  credentials: {
    accountSid: 'AC1234567890abcdef',
    authToken: 'auth_token_here',
    fromNumber: '+1234567890'
  }
});

// Unifonic Provider
const unifonicProvider = await smsService.createProvider('org_123', {
  providerName: 'unifonic',
  displayName: 'Unifonic SMS',
  credentials: {
    apiKey: 'your_app_sid_here',
    senderId: 'YourSenderName'
  }
});
```

### **2. Sending an SMS**
```javascript
const result = await smsService.sendMessage('org_123', {
  from: '+1234567890',
  to: '+1987654321',
  message: 'Hello from SMS provider!',
  language: 'en'
});
```

### **3. Workflow Integration**
```javascript
// Twilio SMS Action
const twilioAction = {
  type: 'sms_message',
  provider: 'twilio',
  fromPhone: '+1234567890',
  toPhone: '{event.userPhone}',
  message: 'Welcome {event.userName}!',
  language: 'en',
  variableMappings: {
    fromPhone: '+1234567890',
    toPhone: '{event.userPhone}',
    message: 'Welcome {event.userName}!'
  }
};

// Unifonic SMS Action
const unifonicAction = {
  type: 'sms_message',
  provider: 'unifonic',
  fromPhone: 'YourSender',
  toPhone: '{event.userPhone}',
  message: 'مرحبا {event.userName}!', // Arabic support
  language: 'ar',
  variableMappings: {
    fromPhone: 'YourSender',
    toPhone: '{event.userPhone}',
    message: 'مرحبا {event.userName}!'
  }
};
```

## 🎨 Workflow Builder Integration

### **SMS Node**
- **Visual component** - Green gradient design
- **Property panel** - Configure SMS settings
- **Dynamic variables** - Support for event data
- **Provider selection** - Choose SMS provider

### **Node Configuration**
```javascript
{
  type: 'sms_message',
  provider: 'twilio',
  templateName: '',
  language: 'en',
  fromPhone: '',
  toPhone: '',
  message: '',
  variableMappings: {
    fromPhone: '',
    toPhone: '',
    message: ''
  }
}
```

## 🔌 Adding New Providers

### **Step 1: Create Provider Implementation**
```javascript
// app/lib/sms/providers/nexmo.ts
import { SMSProvider, SMSProviderConfig, SMSMessage, SMSMessageResult } from './base';

export class NexmoSMSProvider implements SMSProvider {
  getName(): string {
    return 'nexmo';
  }

  getDisplayName(): string {
    return 'Vonage (Nexmo)';
  }

  async configure(config: SMSProviderConfig): Promise<void> {
    // Configure Nexmo client
  }

  async testConnection(): Promise<boolean> {
    // Test Nexmo connection
  }

  async sendMessage(message: SMSMessage): Promise<SMSMessageResult> {
    // Send via Nexmo API
  }
}
```

### **Step 2: Register in Factory**
```javascript
// app/lib/sms/providers/factory.ts
import { NexmoSMSProvider } from './nexmo';

constructor() {
  this.providers.set('twilio', TwilioSMSProvider);
  this.providers.set('nexmo', NexmoSMSProvider); // Add new provider
}
```

### **Step 3: Add Validation**
```javascript
validateProviderConfig(providerName: string, credentials: any) {
  switch (providerName) {
    case 'nexmo':
      if (!credentials.apiKey) {
        errors.push('API Key is required');
      }
      if (!credentials.apiSecret) {
        errors.push('API Secret is required');
      }
      break;
  }
}
```

## 🧪 Testing

### **Provider Testing**
```javascript
// Test provider configuration
const provider = smsProviderFactory.createProvider('twilio');
await provider.configure(config);
const isConnected = await provider.testConnection();
```

### **Message Testing**
```javascript
// Test message sending
const result = await provider.sendMessage({
  from: '+1234567890',
  to: '+1987654321',
  message: 'Test message'
});
```

### **Workflow Testing**
```javascript
// Test workflow integration
const workflowAction = {
  type: 'sms_message',
  provider: 'twilio',
  fromPhone: '+1234567890',
  toPhone: '{event.userPhone}',
  message: 'Welcome!'
};

const result = await workflowService.executeSMSAction(workflowAction, eventData);
```

## 🔒 Security

### **Credential Encryption**
- **Encrypted storage** - Credentials stored securely
- **Access control** - Organization-based access
- **Audit logging** - Track provider usage

### **Webhook Security**
- **Signature validation** - Verify webhook authenticity
- **Secret management** - Secure webhook secrets
- **Rate limiting** - Prevent abuse

## 📊 Monitoring

### **Message Tracking**
- **Delivery status** - Track message delivery
- **Error handling** - Capture and log errors
- **Performance metrics** - Monitor send times

### **Provider Health**
- **Connection monitoring** - Check provider status
- **Usage analytics** - Track provider usage
- **Cost tracking** - Monitor SMS costs

## 🌍 Provider-Specific Features

### **Unifonic SMS Provider**
- **Middle East Focus** - Optimized for Saudi Arabia, UAE, and GCC countries
- **Arabic Language Support** - Native Arabic SMS support
- **Balance Checking** - Real-time account balance monitoring
- **Message Status Tracking** - Detailed delivery status updates
- **Sender ID Management** - Custom sender identification
- **Webhook Support** - Delivery receipt notifications

### **Twilio SMS Provider**
- **Global Coverage** - Worldwide SMS delivery
- **Advanced Features** - MMS, voice, and more
- **Detailed Analytics** - Comprehensive message tracking
- **Webhook Support** - Real-time status updates

## 🚀 Future Enhancements

### **Planned Features**
- **Advanced templates** - Rich template system
- **A/B testing** - Test different messages
- **Scheduling** - Send messages at specific times
- **Analytics** - Message performance tracking

### **Additional Providers**
- **MessageBird** - European SMS provider
- **Plivo** - Global SMS platform
- **Bandwidth** - US-focused provider
- **Custom providers** - Self-hosted solutions

## 🎉 Summary

The SMS Provider System provides:

- ✅ **Extensible architecture** - Easy to add new providers
- ✅ **Workflow integration** - Seamless workflow builder support
- ✅ **Dynamic variables** - Support for event data
- ✅ **Template system** - Message template management
- ✅ **Security** - Encrypted credentials and webhook validation
- ✅ **Monitoring** - Message tracking and provider health

This system makes it easy to add SMS capabilities to your workflows while maintaining flexibility for multiple providers! 