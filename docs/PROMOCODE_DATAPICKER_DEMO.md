# Promo Code Variables in DataPicker Demo

This document demonstrates how promo code variables appear in the DataPicker popup during workflow design.

## How It Works

### 1. Workflow Design Phase

When you're designing a workflow and have multiple nodes:

```
[Trigger] → [Get Promo Code] → [Push Notification] → [WhatsApp Message]
```

### 2. Variable Detection

The system automatically detects promo code nodes and creates mock variables:

**Promo Code Node Configuration:**
- Output Variable: `welcomeCode`
- Batch Name: "Welcome Batch"
- Code Type: Random

**Generated Mock Variables:**
```javascript
{
  welcomeCode: 'MOCK_WELCOMECODE',
  welcomeCode_batchId: 'mock-batch-id',
  welcomeCode_batchName: 'Welcome Batch',
  welcomeCode_discountType: 'percentage',
  welcomeCode_discountValue: 15
}
```

### 3. DataPicker Display

When you click the 📊 button in any action node, you'll see:

#### Event Data Section
- `event.userId`
- `event.name`
- `event.category`
- etc.

#### Execution History Section
- `execution.lastResult.success`
- `execution.lastResult.executionId`
- etc.

#### 🎫 Workflow Variables (Promo Codes) Section
- `welcomeCode: MOCK_WELCOMECODE`
- `welcomeCode_batchId: mock-batch-id`
- `welcomeCode_batchName: Welcome Batch`
- `welcomeCode_discountType: percentage`
- `welcomeCode_discountValue: 15`

### 4. Usage Examples

#### Push Notification
```
Title: Welcome!
Body: Use code {{workflow.welcomeCode}} for 15% off!
```

#### WhatsApp Message
```
Body Variable 1: {{workflow.welcomeCode}}
Body Variable 2: 15% discount
Body Variable 3: Welcome to our store!
```

## Multiple Promo Code Nodes

If you have multiple promo code nodes:

```
[Trigger] → [Get Welcome Code] → [Get VIP Code] → [Push Notification]
```

**First Promo Code Node:**
- Output Variable: `welcomeCode`
- Variables: `welcomeCode`, `welcomeCode_batchId`, etc.

**Second Promo Code Node:**
- Output Variable: `vipCode`
- Variables: `vipCode`, `vipCode_batchId`, etc.

**DataPicker shows both sets of variables:**
- `welcomeCode: MOCK_WELCOMECODE`
- `vipCode: MOCK_VIPCODE`
- `welcomeCode_batchId: mock-batch-id`
- `vipCode_batchId: mock-batch-id-2`
- etc.

## Variable Naming Convention

The system follows this naming pattern:

- **Main Variable**: `{outputVariable}` (e.g., `welcomeCode`)
- **Batch Info**: `{outputVariable}_batchId`, `{outputVariable}_batchName`
- **Discount Info**: `{outputVariable}_discountType`, `{outputVariable}_discountValue`

## Real vs Mock Variables

### Design Phase (Mock)
- Variables show as `MOCK_WELCOMECODE`, `MOCK_VIPCODE`
- Used for testing and preview during workflow design
- Generated automatically from promo code node configuration

### Execution Phase (Real)
- Variables contain actual promo codes like `SUMMER15`, `VIP2024`
- Generated during actual workflow execution
- Retrieved from the database

## Testing the Integration

1. **Create a workflow** with multiple nodes
2. **Add a promo code node** and configure it
3. **Select an action node** (push notification or WhatsApp)
4. **Click the 📊 button** in any input field
5. **Look for the 🎫 Workflow Variables section**
6. **Click "Select"** to insert variables into your text

## Example Workflow

```
Trigger: User signs up
↓
Get Promo Code: welcomeCode from "Welcome Batch"
↓
Push Notification: "Welcome! Use code {{workflow.welcomeCode}} for 15% off!"
↓
WhatsApp Message: "Your VIP code: {{workflow.welcomeCode}}"
```

In this workflow, when you configure the Push Notification or WhatsApp Message nodes, the DataPicker will show `welcomeCode` as an available variable.

## Troubleshooting

### Variables Not Appearing?
1. Make sure you have a promo code node in your workflow
2. Check that the promo code node is configured with an output variable
3. Ensure the promo code node comes before the action node you're configuring

### Wrong Variable Names?
1. Check the "Output Variable" setting in your promo code node
2. Variables are named based on this setting
3. If you change the output variable, update your action configurations

### Mock Values?
- Mock values are normal during design phase
- Real values will appear during actual workflow execution
- Mock values help you test the workflow structure 