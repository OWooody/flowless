# Template API Testing Guide

## 🔍 Testing the Template Discovery API

### **📋 API Endpoint Details:**
- **URL**: `GET /api/whatsapp/templates/{templateName}`
- **Authentication**: Required (Clerk)
- **Method**: GET
- **Parameters**: `templateName` (path parameter)

### **🚀 Curl Commands:**

#### **1. Basic Test (Will return 401 - Unauthorized)**
```bash
curl -X GET "http://localhost:3000/api/whatsapp/templates/welcome_message" \
  -H "Content-Type: application/json"
```

#### **2. With Authentication Headers (You'll need to get these from your browser)**
```bash
curl -X GET "http://localhost:3000/api/whatsapp/templates/welcome_message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Cookie: __session=YOUR_SESSION_COOKIE"
```

### **🔧 How to Get Authentication Headers:**

#### **Method 1: Browser Developer Tools**
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Enter a template name in the test form
5. Look for the API call to `/api/whatsapp/templates/...`
6. Right-click → Copy → Copy as cURL
7. Use the copied curl command

#### **Method 2: Manual Extraction**
1. Open Developer Tools → **Application** tab
2. Go to **Cookies** → `localhost:3000`
3. Copy the `__session` cookie value
4. Go to **Local Storage** → `localhost:3000`
5. Look for Clerk tokens (usually start with `clerk`)

### **📋 Test Template Names to Try:**

#### **Common Template Names:**
```bash
# Test with these template names
curl -X GET "http://localhost:3000/api/whatsapp/templates/welcome_message"
curl -X GET "http://localhost:3000/api/whatsapp/templates/order_status"
curl -X GET "http://localhost:3000/api/whatsapp/templates/delivery_update"
curl -X GET "http://localhost:3000/api/whatsapp/templates/payment_confirmation"
curl -X GET "http://localhost:3000/api/whatsapp/templates/account_verification"
```

#### **Test with Non-existent Template:**
```bash
curl -X GET "http://localhost:3000/api/whatsapp/templates/nonexistent_template"
```

### **🎯 Expected Responses:**

#### **Success Response (200):**
```json
{
  "success": true,
  "template": {
    "name": "welcome_message",
    "displayName": "Welcome Message",
    "category": "marketing",
    "language": "en",
    "variables": [
      {
        "name": "customer_name",
        "position": 1,
        "required": true,
        "type": "string",
        "description": "Customer's name",
        "isNumbered": false
      },
      {
        "name": "1",
        "position": 2,
        "required": true,
        "type": "string",
        "description": "Variable 1",
        "isNumbered": true
      }
    ],
    "isActive": true,
    "status": "ACTIVE"
  }
}
```

#### **Unauthorized Response (401):**
```json
{
  "error": "Unauthorized"
}
```

#### **Template Not Found (404):**
```json
{
  "success": false,
  "error": "Template 'nonexistent_template' not found"
}
```

#### **Bad Request (400):**
```json
{
  "error": "Template name is required"
}
```

### **🔧 Postman Setup:**

#### **1. Create New Request:**
- **Method**: GET
- **URL**: `http://localhost:3000/api/whatsapp/templates/welcome_message`

#### **2. Add Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_CLERK_TOKEN
```

#### **3. Add Cookies (if needed):**
```
__session: YOUR_SESSION_COOKIE
```

### **📋 Testing Steps:**

#### **Step 1: Test Without Auth**
```bash
curl -X GET "http://localhost:3000/api/whatsapp/templates/test"
# Expected: 401 Unauthorized
```

#### **Step 2: Test with Auth (from browser)**
1. Open your app in browser
2. Log in to get authentication
3. Open Developer Tools → Network
4. Enter template name in test form
5. Copy the curl command from Network tab
6. Use that curl command in terminal

#### **Step 3: Test Different Templates**
```bash
# Try with different template names
curl -X GET "http://localhost:3000/api/whatsapp/templates/welcome_message"
curl -X GET "http://localhost:3000/api/whatsapp/templates/order_status"
curl -X GET "http://localhost:3000/api/whatsapp/templates/nonexistent"
```

### **🎯 Debug Information:**

#### **Check Server Logs:**
Look at the terminal where Next.js is running for detailed logs:
```
🔍 Template API called for template: welcome_message
👤 User: user_123, Org: org_456
📋 Fetching template by name: welcome_message
✅ Template found: welcome_message with 2 variables
```

#### **Check Browser Console:**
Open browser console to see client-side logs:
```
🔍 Fetching template info for: welcome_message
📡 API Response status: 200
📄 API Response data: { success: true, template: {...} }
```

### **🚀 Quick Test Commands:**

#### **Test API Endpoint (Unauthorized):**
```bash
curl -X GET "http://localhost:3000/api/whatsapp/templates/test" -v
```

#### **Test with Real Template (Need Auth):**
```bash
# Get this from browser Network tab after entering template name
curl -X GET "http://localhost:3000/api/whatsapp/templates/welcome_message" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cookie: __session=YOUR_SESSION"
```

### **📞 Need Help?**

If you're getting errors, check:
1. **Server is running**: `npm run dev`
2. **Authentication**: Make sure you're logged in
3. **Template exists**: Use a real template name from Freshchat
4. **Freshchat configured**: Set up WhatsApp provider first

Share the error response and server logs for debugging! 