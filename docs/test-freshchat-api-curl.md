# Freshchat API Testing Guide

## 🔍 Testing Freshchat API Endpoints Directly

### **📋 Freshchat API Endpoints We're Using:**

#### **1. Template Discovery Endpoint:**
```bash
curl -X GET "https://your-account.freshchat.com/v2/templates?name=welcome_message" \
  -H "Authorization: Bearer YOUR_FRESHCHAT_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

#### **2. Connection Test Endpoint:**
```bash
curl -X GET "https://your-account.freshchat.com/v2/accounts/configuration" \
  -H "Authorization: Bearer YOUR_FRESHCHAT_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

#### **3. Send WhatsApp Message Endpoint:**
```bash
curl -X POST "https://your-account.freshchat.com/v2/outbound-messages/whatsapp" \
  -H "Authorization: Bearer YOUR_FRESHCHAT_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "YOUR_CHANNEL_ID",
    "to": "+1234567890",
    "template": {
      "name": "welcome_message",
      "language": "en",
      "variables": {
        "customer_name": "John Doe"
      }
    }
  }'
```

### **🔧 How to Get Your Freshchat Credentials:**

#### **1. Get Your Account URL:**
- Log into your Freshchat dashboard
- Your account URL will be: `https://your-account.freshchat.com`
- Replace `your-account` with your actual account name

#### **2. Get Your Bearer Token:**
- Go to Freshchat Settings → API
- Generate or copy your API token
- This is your `YOUR_FRESHCHAT_TOKEN`

#### **3. Get Your Channel ID:**
- Go to WhatsApp Settings in Freshchat
- Find your WhatsApp channel ID
- This is your `YOUR_CHANNEL_ID`

### **📋 Test Commands with Placeholders:**

#### **Test Connection:**
```bash
curl -X GET "https://YOUR_ACCOUNT.freshchat.com/v2/accounts/configuration" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -v
```

#### **Test Template Discovery:**
```bash
curl -X GET "https://YOUR_ACCOUNT.freshchat.com/v2/templates?name=welcome_message" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -v
```

#### **Test Send Message:**
```bash
curl -X POST "https://YOUR_ACCOUNT.freshchat.com/v2/outbound-messages/whatsapp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "YOUR_CHANNEL_ID",
    "to": "+1234567890",
    "template": {
      "name": "welcome_message",
      "language": "en",
      "variables": {
        "customer_name": "John Doe"
      }
    }
  }' \
  -v
```

### **🎯 Expected Responses:**

#### **Connection Test Success (200):**
```json
{
  "account": {
    "id": "account_123",
    "name": "Your Account Name",
    "status": "active"
  }
}
```

#### **Template Discovery Success (200):**
```json
{
  "templates": [
    {
      "id": "template_123",
      "name": "welcome_message",
      "displayName": "Welcome Message",
      "content": "Hello {{1}}, welcome to {{2}}!",
      "variables": [
        {
          "name": "customer_name",
          "type": "string",
          "required": true
        }
      ]
    }
  ]
}
```

#### **Send Message Success (200):**
```json
{
  "id": "message_123",
  "status": "sent",
  "to": "+1234567890",
  "template": {
    "name": "welcome_message"
  }
}
```

### **❌ Common Error Responses:**

#### **Unauthorized (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

#### **Template Not Found (404):**
```json
{
  "error": "Template not found",
  "message": "Template 'nonexistent' does not exist"
}
```

#### **Invalid Request (400):**
```json
{
  "error": "Bad Request",
  "message": "Missing required field: channelId"
}
```

### **🔧 Debugging Steps:**

#### **Step 1: Test Connection**
```bash
# Test if your credentials work
curl -X GET "https://YOUR_ACCOUNT.freshchat.com/v2/accounts/configuration" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -v
```

#### **Step 2: Test Template Discovery**
```bash
# Test if you can fetch templates
curl -X GET "https://YOUR_ACCOUNT.freshchat.com/v2/templates?name=YOUR_TEMPLATE" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -v
```

#### **Step 3: Test Send Message**
```bash
# Test if you can send a message
curl -X POST "https://YOUR_ACCOUNT.freshchat.com/v2/outbound-messages/whatsapp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "YOUR_CHANNEL_ID",
    "to": "+1234567890",
    "template": {
      "name": "YOUR_TEMPLATE",
      "language": "en",
      "variables": {
        "customer_name": "Test User"
      }
    }
  }' \
  -v
```

### **📋 Replace These Placeholders:**

- `YOUR_ACCOUNT` → Your Freshchat account name
- `YOUR_TOKEN` → Your Freshchat API token
- `YOUR_CHANNEL_ID` → Your WhatsApp channel ID
- `YOUR_TEMPLATE` → A template name that exists in your account
- `+1234567890` → A test phone number

### **🚀 Quick Test Example:**

If your account is `mycompany` and you have a template called `welcome_message`:

```bash
# Test connection
curl -X GET "https://mycompany.freshchat.com/v2/accounts/configuration" \
  -H "Authorization: Bearer sk_1234567890abcdef" \
  -H "Accept: application/json"

# Test template discovery
curl -X GET "https://mycompany.freshchat.com/v2/templates?name=welcome_message" \
  -H "Authorization: Bearer sk_1234567890abcdef" \
  -H "Accept: application/json"

# Test send message
curl -X POST "https://mycompany.freshchat.com/v2/outbound-messages/whatsapp" \
  -H "Authorization: Bearer sk_1234567890abcdef" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "whatsapp_channel_123",
    "to": "+1234567890",
    "template": {
      "name": "welcome_message",
      "language": "en",
      "variables": {
        "customer_name": "John Doe"
      }
    }
  }'
```

### **📞 Need Help?**

If you're getting errors:
1. **Check your account URL** - make sure it's correct
2. **Verify your API token** - ensure it's valid and has proper permissions
3. **Confirm your channel ID** - make sure it's the correct WhatsApp channel
4. **Test with a real template name** - use one that exists in your Freshchat account

Share the error response and I can help debug further! 