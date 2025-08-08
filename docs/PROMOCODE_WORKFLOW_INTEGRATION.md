# Promo Code Workflow Integration

This document explains how to use promo codes in workflows to automatically get codes from batches and use them in subsequent actions.

## Overview

The promo code workflow integration allows you to:
- Add a "Get Promo Code" node to your workflows
- Automatically retrieve codes from existing batches
- Use the retrieved codes as variables in subsequent actions
- Track code usage and batch statistics

## How It Works

1. **Create a Promo Code Batch**: First, create a batch of promo codes using the promo code management system
2. **Add Promo Code Node**: Add a "Get Promo Code" node to your workflow
3. **Configure the Node**: Select a batch and configure how codes should be selected
4. **Use in Actions**: The retrieved code becomes available as a variable in subsequent actions

## Workflow Node Types

### Get Promo Code Node

**Purpose**: Retrieves a promo code from a specified batch

**Configuration Options**:
- **Batch Selection**: Choose from available promo code batches
- **Code Selection Type**:
  - **Random**: Gets a random unused code from the batch
  - **Sequential**: Gets the next available code (oldest unused)
  - **Specific**: Gets a specific code by exact match
- **Output Variable**: Name of the variable to store the code (default: `promoCode`)

**Output Data**:
```json
{
  "code": "SUMMER15",
  "batchId": "batch_123",
  "batchName": "Summer Sale 2024",
  "discountType": "percentage",
  "discountValue": 15,
  "minOrderValue": 50,
  "outputVariable": "promoCode"
}
```

## Usage Examples

### Example 1: Welcome Flow with Promo Code

**Workflow**:
1. **Trigger**: User signs up
2. **Get Promo Code**: Random code from "Welcome Batch"
3. **Push Notification**: Send welcome message with promo code

**Configuration**:
```json
{
  "trigger": {
    "eventType": "signup",
    "filters": {
      "eventName": "user_signup"
    }
  },
  "actions": [
    {
      "type": "promo_code",
      "batchId": "welcome_batch_123",
      "batchName": "Welcome Batch",
      "outputVariable": "welcomeCode",
      "codeType": "random"
    },
    {
      "type": "push_notification",
      "title": "Welcome!",
      "body": "Use code {welcomeCode} for 10% off your first order!",
      "targetUsers": "specific",
      "userIds": ["{event.userId}"]
    }
  ]
}
```

### Example 2: Purchase Flow with Dynamic Promo Code

**Workflow**:
1. **Trigger**: User makes a purchase
2. **Get Promo Code**: Sequential code from "Purchase Batch"
3. **WhatsApp Message**: Send thank you with next promo code

**Configuration**:
```json
{
  "trigger": {
    "eventType": "purchase",
    "filters": {
      "eventName": "purchase_completed"
    }
  },
  "actions": [
    {
      "type": "promo_code",
      "batchId": "purchase_batch_456",
      "batchName": "Purchase Rewards",
      "outputVariable": "nextCode",
      "codeType": "sequential"
    },
    {
      "type": "whatsapp_message",
      "provider": "freshchat",
      "templateName": "purchase_thank_you",
      "namespace": "fc3df069_22dc_4a5f_a669_2f7329af60d1",
      "language": "en",
      "bodyVariable1": "{event.userName}",
      "bodyVariable2": "{nextCode}",
      "bodyVariable3": "20% off next purchase"
    }
  ]
}
```

### Example 3: Abandoned Cart with Specific Promo Code

**Workflow**:
1. **Trigger**: User abandons cart
2. **Get Promo Code**: Specific code for abandoned cart
3. **Push Notification**: Send reminder with specific code

**Configuration**:
```json
{
  "trigger": {
    "eventType": "engagement",
    "filters": {
      "eventName": "cart_abandoned"
    }
  },
  "actions": [
    {
      "type": "promo_code",
      "batchId": "abandoned_cart_batch_789",
      "batchName": "Abandoned Cart Recovery",
      "outputVariable": "recoveryCode",
      "codeType": "specific",
      "specificCode": "COMEBACK20"
    },
    {
      "type": "push_notification",
      "title": "Don't miss out!",
      "body": "Complete your purchase with code {recoveryCode} for 20% off!",
      "targetUsers": "specific",
      "userIds": ["{event.userId}"]
    }
  ]
}
```

## Variable Usage

The retrieved promo code can be used in subsequent actions using the output variable name:

### In Push Notifications
```
Title: Special Offer!
Body: Use code {promoCode} for 20% off your next purchase!
```

### In WhatsApp Messages
```
Body Variable 1: {promoCode}
Body Variable 2: 20% discount
```

### In Email Templates
```
Subject: Your exclusive promo code
Body: Here's your special code: {promoCode}
```

## Batch Information Display

When configuring a promo code node, the system shows:
- **Batch Name**: Name of the selected batch
- **Available Codes**: Number of unused codes remaining
- **Discount Type**: Percentage, fixed amount, or free shipping
- **Discount Value**: The actual discount amount
- **Minimum Order**: Minimum order value required
- **Validity Period**: When the batch is active

## Code Selection Strategies

### Random Selection
- **Use Case**: General promotions, welcome flows
- **Advantage**: Distributes usage evenly across batch
- **Best For**: High-volume campaigns

### Sequential Selection
- **Use Case**: VIP customers, priority promotions
- **Advantage**: Predictable order, oldest codes used first
- **Best For**: Limited-time offers, VIP programs

### Specific Selection
- **Use Case**: Special campaigns, partner promotions
- **Advantage**: Exact control over which code is used
- **Best For**: Partner promotions, special events

## Error Handling

The system handles various error scenarios:

### Batch Not Found
- Error: "Batch not found"
- Solution: Check batch ID and user permissions

### No Available Codes
- Error: "No unused codes available in this batch"
- Solution: Create new batch or check batch status

### Batch Inactive
- Error: "Batch is not active"
- Solution: Activate the batch in promo code management

### Batch Expired
- Error: "Batch has expired"
- Solution: Create new batch with valid dates

### Specific Code Not Found
- Error: "Specific code not found or already used"
- Solution: Check code spelling or use different code

## Best Practices

### 1. Batch Management
- Create separate batches for different use cases
- Monitor batch usage and create new batches before running out
- Use descriptive batch names for easy identification

### 2. Code Selection
- Use random selection for general promotions
- Use sequential selection for VIP or priority customers
- Use specific codes for special campaigns or partners

### 3. Workflow Design
- Place promo code nodes early in the workflow
- Use descriptive variable names (e.g., `welcomeCode`, `vipCode`)
- Test workflows with small batches first

### 4. Monitoring
- Regularly check batch usage statistics
- Monitor workflow execution logs
- Track promo code redemption rates

## API Integration

The promo code workflow integration uses the following API endpoints:

### GET /api/promocodes
Fetches available batches for node configuration

### POST /api/promocodes/get-code
Retrieves a promo code from a batch during workflow execution

**Request**:
```json
{
  "batchId": "batch_123",
  "codeType": "random",
  "specificCode": "CODE123" // optional, only for specific type
}
```

**Response**:
```json
{
  "code": "SUMMER15",
  "batchId": "batch_123",
  "batchName": "Summer Sale 2024",
  "discountType": "percentage",
  "discountValue": 15,
  "minOrderValue": 50
}
```

## Security Considerations

- **Authentication**: All API calls require user authentication
- **Authorization**: Users can only access their own batches
- **Rate Limiting**: API calls are rate-limited to prevent abuse
- **Audit Trail**: All code usage is logged with user and timestamp

## Troubleshooting

### Common Issues

1. **"Batch not found" error**
   - Verify the batch exists and belongs to the user
   - Check batch ID spelling
   - Ensure user has proper permissions

2. **"No available codes" error**
   - Check batch usage statistics
   - Create new batch with more codes
   - Verify batch is active and not expired

3. **Variable not resolving**
   - Check output variable name spelling
   - Ensure promo code node is connected to subsequent actions
   - Verify variable syntax (e.g., `{promoCode}`)

4. **Workflow execution fails**
   - Check batch validity dates
   - Verify batch is active
   - Review workflow execution logs

### Debug Steps

1. **Check Batch Status**
   - Navigate to `/promocodes`
   - Verify batch is active and has available codes
   - Check validity dates

2. **Test API Directly**
   - Use the API endpoint directly to test code retrieval
   - Verify authentication and permissions

3. **Review Workflow Logs**
   - Check workflow execution history
   - Review step-by-step execution logs
   - Look for specific error messages

4. **Validate Workflow Configuration**
   - Ensure promo code node is properly configured
   - Verify connections between nodes
   - Check variable names and syntax 