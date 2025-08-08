# 🚀 Freshchat Provider Customization Guide

## **Overview**
This guide shows you how to customize the Freshchat WhatsApp provider input form in your application. The configuration is managed in the provider factory and supports various field types.

## **📍 File Location**
The Freshchat configuration is located in:
```
app/lib/whatsapp/providers/factory.ts
```

## **🎯 How to Customize Freshchat Inputs**

### **1. Basic Field Modifications**

You can modify existing fields by changing their properties in the `getProviderConfigFields` method:

```typescript
freshchat: {
  apiKey: {
    type: 'text',
    label: 'Your Custom Label',           // Change the field label
    required: true,
    placeholder: 'Your custom placeholder', // Change placeholder text
    help: 'Your custom help text'         // Change help text
  }
}
```

### **2. Available Field Types**

The system supports these field types:

#### **Text Input**
```typescript
{
  type: 'text',
  label: 'Field Label',
  required: true,
  placeholder: 'Enter value',
  help: 'Help text'
}
```

#### **Password Input**
```typescript
{
  type: 'password',
  label: 'Password Field',
  required: true,
  placeholder: 'Enter password',
  help: 'Help text'
}
```

#### **URL Input**
```typescript
{
  type: 'url',
  label: 'Website URL',
  required: false,
  placeholder: 'https://example.com',
  help: 'Must be a valid URL'
}
```

#### **Select Dropdown**
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

### **3. Current Freshchat Configuration**

Here's the current configuration with all available fields:

```typescript
freshchat: {
  apiKey: {
    type: 'text',
    label: 'Freshchat API Key',
    required: true,
    placeholder: 'fc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Find your API key in Freshchat Dashboard > Settings > API Keys'
  },
  apiSecret: {
    type: 'password',
    label: 'Freshchat API Secret',
    required: true,
    placeholder: 'Enter your API secret',
    help: 'Your API secret from Freshchat Dashboard > Settings > API Keys'
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
  }
}
```

## **🔧 Customization Examples**

### **Example 1: Add a Custom Field**
```typescript
// Add this to the freshchat configuration
customField: {
  type: 'text',
  label: 'Custom Field',
  required: false,
  placeholder: 'Enter custom value',
  help: 'This is a custom field for your needs'
}
```

### **Example 2: Modify Existing Field**
```typescript
// Change the API Key field
apiKey: {
  type: 'text',
  label: 'Freshchat Integration Key',  // Changed label
  required: true,
  placeholder: 'Enter your integration key',  // Changed placeholder
  help: 'Get this from your Freshchat integration settings'  // Changed help
}
```

### **Example 3: Add a New Select Field**
```typescript
// Add a new dropdown
messageType: {
  type: 'select',
  label: 'Message Type',
  required: true,
  options: [
    { value: 'text', label: 'Text Message' },
    { value: 'template', label: 'Template Message' },
    { value: 'media', label: 'Media Message' }
  ],
  defaultValue: 'text',
  help: 'Select the type of messages to send'
}
```

### **Example 4: Add a Number Field**
```typescript
// Add a number input (using text type with validation)
rateLimit: {
  type: 'text',
  label: 'Rate Limit (messages/hour)',
  required: false,
  placeholder: '100',
  help: 'Maximum messages per hour (optional)'
}
```

## **🎨 UI Features**

The form automatically supports:

- **Field Validation**: Required fields are marked with red asterisk (*)
- **Help Text**: Displays below each field
- **Placeholder Text**: Shows example values
- **Dropdown Options**: For select fields
- **Default Values**: For select fields
- **Error Handling**: Shows validation errors
- **Responsive Design**: Works on mobile and desktop

## **🔍 Validation Rules**

The system automatically validates:

- **Required Fields**: Must not be empty
- **URL Fields**: Must be valid URLs
- **Select Fields**: Must have a selected value if required
- **Password Fields**: Hidden input for security

## **🚀 Adding New Field Types**

To add a new field type, you need to:

1. **Update the Factory**: Add the field type to `getProviderConfigFields`
2. **Update the UI**: Modify `app/whatsapp/page.tsx` to handle the new type
3. **Update Validation**: Add validation rules in `validateProviderConfig`

### **Example: Adding a Textarea Field**

1. **Add to Factory**:
```typescript
description: {
  type: 'textarea',
  label: 'Description',
  required: false,
  placeholder: 'Enter description',
  help: 'Optional description for this integration'
}
```

2. **Update UI** (in `app/whatsapp/page.tsx`):
```typescript
{config.type === 'textarea' ? (
  <textarea
    value={formData[field] || ''}
    onChange={(e) => handleInputChange(field, e.target.value)}
    placeholder={config.placeholder}
    required={config.required}
    rows={4}
    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
  />
) : (
  // ... existing input logic
)}
```

## **📝 Best Practices**

1. **Clear Labels**: Use descriptive, user-friendly labels
2. **Helpful Placeholders**: Show example values or format
3. **Detailed Help Text**: Explain what the field is for
4. **Logical Ordering**: Put required fields first
5. **Consistent Naming**: Use consistent naming conventions
6. **Validation**: Add appropriate validation rules
7. **Default Values**: Provide sensible defaults for select fields

## **🔧 Testing Your Changes**

After making changes:

1. **Restart the server**: `npm run dev`
2. **Visit the WhatsApp page**: Navigate to `/whatsapp`
3. **Test the form**: Try configuring a Freshchat provider
4. **Verify validation**: Test required fields and validation
5. **Check UI**: Ensure all fields display correctly

## **🎯 Common Customizations**

### **Change Field Labels**
```typescript
label: 'Your Custom Label'
```

### **Update Help Text**
```typescript
help: 'Your custom help text with instructions'
```

### **Add New Options to Select**
```typescript
options: [
  { value: 'existing', label: 'Existing Option' },
  { value: 'new', label: 'New Option' }
]
```

### **Make Field Optional**
```typescript
required: false
```

### **Change Default Value**
```typescript
defaultValue: 'new-default'
```

## **🚀 Next Steps**

Now you can:
1. **Customize the Freshchat form** to match your needs
2. **Add new fields** for additional configuration
3. **Modify existing fields** for better UX
4. **Add new field types** for advanced functionality
5. **Test your changes** to ensure they work correctly

The Freshchat provider is now fully customizable and ready for your specific requirements! 