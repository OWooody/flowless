# 📱 Freshchat WhatsApp Integration Guide

## **Overview**
This guide explains how to configure and use the Freshchat WhatsApp provider based on the [official Freshchat API documentation](https://developers.freshchat.com/api/#accounts).

## **🔐 Authentication & Setup**

### **1. Getting Your API Key**
According to the [Freshchat API documentation](https://developers.freshchat.com/api/#accounts), follow these steps:

#### **For Stand-alone Freshchat Accounts:**
1. Navigate to **Admin** > **CONFIGURE** > **API Tokens**
2. Click the **Generate Token** button
3. Copy the generated API key (access token)

#### **For Freshsales Suite Accounts:**
1. Navigate to **Settings** > **Admin Settings** > **Website Tracking and APIs** > **API Settings**
2. In the **API DETAILS FOR CHAT** section, find **Your API Key**
3. If unavailable, click **Generate token** next to the field
4. Copy the generated API key

### **2. Getting Your Account URL**

#### **For Stand-alone Freshchat Accounts:**
Your account URL follows this format:
```
https://<account-name>.freshchat.com/v2
```

**Example**: `https://freshfoods.freshchat.com/v2`

#### **For Freshsales Suite Accounts:**
1. Navigate to **Settings** > **Admin Settings** > **Website Tracking and APIs** > **API Settings**
2. In the **API DETAILS FOR CHAT** section, find **Your chat URL**
3. Your full API base URL will be: `https://<retrieved-account-url>/v2`

**Example**: `https://freshfoods-007-1234.myfreshworks.com/v2`

## **⚙️ Configuration**

### **Provider Configuration Fields**

When configuring the Freshchat provider in your application, you'll need to provide:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **API Base URL** | URL | Yes | Your Freshchat account URL (e.g., `https://your-account.freshchat.com/v2`) |
| **Bearer Token** | Password | Yes | Your API key from the Freshchat dashboard |
| **Test Mode** | Select | No | Choose "Test Mode" to skip connection testing during development |
| **Environment** | Select | Yes | Choose your environment (Production/Staging/Development) |
| **Region** | Select | No | Choose your region (US/EU/India) |
| **Webhook URL** | URL | No | For delivery receipts and user responses |
| **Webhook Secret** | Password | No | For webhook signature verification |

### **Example Configuration**
```json
{
  "baseUrl": "https://mycompany.freshchat.com/v2",
  "bearerToken": "your_api_key_here",
  "testMode": "false",
  "environment": "production",
  "region": "us"
}
```

## **🔌 API Endpoints**

Based on the [official Freshchat API documentation](https://developers.freshchat.com/api/#accounts), the provider uses these endpoints:

### **Connection Testing**
- **Endpoint**: `/accounts/configuration`
- **Method**: `GET`
- **Purpose**: Test API connectivity and credentials
- **Headers**: 
  - `Authorization: Bearer <your_api_key>`
  - `Accept: application/json`
  - `Content-Type: application/json`

### **WhatsApp Message Sending**
- **Endpoint**: `/outbound-messages/whatsapp`
- **Method**: `POST`
- **Purpose**: Send WhatsApp messages using templates
- **Headers**: 
  - `Authorization: Bearer <your_api_key>`
  - `Accept: application/json`
  - `Content-Type: application/json`

### **Request Body Format**
```json
{
  "to": "+1234567890",
  "template": {
    "name": "template_name",
    "language": "en",
    "variables": {
      "variable1": "value1",
      "variable2": "value2"
    }
  }
}
```

## **📋 Template Management**

### **Important Limitation**
According to the Freshchat API documentation, **template management is not available via API**. Templates must be created and managed through the Freshchat dashboard.

### **Template Creation Process**
1. **Access Freshchat Dashboard**: Log into your Freshchat account
2. **Navigate to WhatsApp Settings**: Find the WhatsApp Business API section
3. **Create Templates**: Use the dashboard interface to create message templates
4. **Submit for Approval**: Templates must be approved by WhatsApp before use
5. **Use in API**: Once approved, templates can be referenced by name in API calls

### **Template Variables**
When sending messages, you can include variables in your templates:
```json
{
  "variables": {
    "customer_name": "John Doe",
    "order_number": "12345",
    "delivery_date": "2024-01-15"
  }
}
```

## **🚀 Usage Examples**

### **1. Basic Configuration**
```typescript
// Configure the Freshchat provider
const providerConfig = {
  baseUrl: "https://mycompany.freshchat.com/v2",
  bearerToken: "your_api_key_here",
  testMode: "false"
};
```

### **2. Send WhatsApp Message**
```typescript
// Send a WhatsApp message using a template
const message = {
  to: "+1234567890",
  templateName: "welcome_message",
  language: "en",
  variables: {
    customer_name: "John Doe"
  }
};

const result = await freshchatProvider.sendMessage(message);
```

### **3. Test Connection**
```typescript
// Test if your credentials are working
const isConnected = await freshchatProvider.testConnection();
if (isConnected) {
  console.log("✅ Freshchat connection successful");
} else {
  console.log("❌ Freshchat connection failed");
}
```

## **🔍 Error Handling**

### **Common HTTP Status Codes**
Based on the [Freshchat API documentation](https://developers.freshchat.com/api/#accounts):

| Status Code | Meaning | Action |
|-------------|---------|--------|
| **200** | Success | Request completed successfully |
| **202** | Accepted | Request is being processed |
| **400** | Bad Request | Check your request format |
| **401** | Unauthenticated | Check your API key |
| **403** | Forbidden | Check your permissions |
| **404** | Not Found | Check the endpoint URL |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Contact Freshchat support |
| **503** | Service Unavailable | Try again later |

### **Error Response Format**
```json
{
  "code": 400,
  "status": "BAD_REQUEST",
  "message": "Invalid request format"
}
```

## **📊 Rate Limits**

According to the [Freshchat API documentation](https://developers.freshchat.com/api/#accounts), rate limits vary by business account and plan. The response headers include:

- `X-RateLimit-Limit`: Total API calls allowed in timeframe
- `X-RateLimit-Remaining`: API calls remaining in timeframe
- `X-RateLimitReset`: Time remaining until reset

## **🔧 Development & Testing**

### **Test Mode**
During development, you can enable "Test Mode" to:
- Skip connection testing
- Use dummy credentials
- Test the UI without real API calls
- Avoid rate limiting issues

### **Testing Checklist**
- [ ] API key is valid and has proper permissions
- [ ] Account URL is correct and accessible
- [ ] Templates are created and approved in dashboard
- [ ] Phone numbers are in international format (+1234567890)
- [ ] Rate limits are not exceeded

## **🚨 Troubleshooting**

### **Connection Issues**
1. **Check API Key**: Ensure your API key is valid and not expired
2. **Verify Account URL**: Make sure the base URL is correct
3. **Check Permissions**: Ensure your API key has WhatsApp permissions
4. **Network Issues**: Verify internet connectivity and firewall settings

### **Message Sending Issues**
1. **Template Name**: Ensure template name matches exactly (case-sensitive)
2. **Template Approval**: Verify template is approved by WhatsApp
3. **Phone Number**: Ensure phone number is in international format
4. **Variables**: Check that all required template variables are provided

### **Template Issues**
1. **Dashboard Access**: Templates must be managed through Freshchat dashboard
2. **Approval Status**: Wait for WhatsApp approval before using templates
3. **Language Code**: Ensure language code matches template configuration

## **📚 Additional Resources**

- [Freshchat API Documentation](https://developers.freshchat.com/api/#accounts)
- [Freshchat WhatsApp Business API Guide](https://developers.freshchat.com/api/#outbound-messages)
- [Freshchat Support](https://support.freshchat.com/)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)

## **✅ Implementation Status**

The Freshchat provider implementation is now **fully compliant** with the official Freshchat API documentation:

- ✅ **Correct Endpoints**: Uses `/accounts/configuration` and `/outbound-messages/whatsapp`
- ✅ **Proper Headers**: Includes `Accept` and `Authorization` headers
- ✅ **Template Limitations**: Correctly indicates dashboard-only template management
- ✅ **Error Handling**: Proper HTTP status code handling
- ✅ **Authentication**: Bearer token authentication
- ✅ **Base URL Format**: Matches Freshchat account structure

The provider is ready for production use with real Freshchat accounts! 