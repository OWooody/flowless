# Conditional Logic Guide

## Overview

The Conditional Logic feature allows you to create intelligent workflows that can branch based on data, user behavior, or business rules. Instead of executing actions in a straight line, your workflows can now adapt and take different paths based on conditions you define.

## 🎯 How It Works

### Basic Concept
- **Condition Node**: A new node type that evaluates a condition
- **Two Outputs**: True (green) and False (red) branches
- **Dynamic Variables**: Use variables like `{event.userId}` or `{workflow.promoCode}`
- **Multiple Conditions**: Equals, Not Equals, Greater Than, Less Than, Contains, Not Contains

## 🔧 Adding a Condition Node

1. **Drag from Palette**: Drag the "Condition" node from the Logic category
2. **Configure Properties**: Set up your condition in the property panel
3. **Connect Branches**: Connect the True/False outputs to different actions

## 📝 Condition Types

### Equals (=)
```javascript
{event.userId} = user123
{workflow.promoCode} = SUMMER20
```

### Not Equals (≠)
```javascript
{event.userId} ≠ user123
{event.category} ≠ admin
```

### Greater Than (>)
```javascript
{event.value} > 100
{workflow.orderTotal} > 500
```

### Less Than (<)
```javascript
{event.value} < 50
{event.age} < 18
```

### Contains (⊃)
```javascript
{event.userEmail} ⊃ @gmail.com
{event.userName} ⊃ John
```

### Not Contains (⊅)
```javascript
{event.userEmail} ⊅ @spam.com
{event.userName} ⊅ Test
```

## 🎨 Using Dynamic Variables

### Event Variables
Access data from the triggering event:
- `{event.userId}` - User ID from the event
- `{event.value}` - Numeric value from the event
- `{event.category}` - Event category
- `{event.userEmail}` - User's email address
- `{event.userPhone}` - User's phone number
- `{event.itemName}` - Item name from the event
- `{event.itemId}` - Item ID from the event
- `{event.itemCategory}` - Item category from the event
- `{event.action}` - Action performed (purchase, view, etc.)
- `{event.path}` - Page path where event occurred
- `{event.pageTitle}` - Page title where event occurred

### Workflow Variables
Access data from previous workflow actions:
- `{workflow.promoCode}` - Promo code from a promo code action
- `{workflow.orderTotal}` - Order total from a previous action
- `{workflow.customerName}` - Customer name from previous action

### Static Values
You can also use static values:
- `100` - Numeric value
- `"VIP"` - String value
- `true` - Boolean value

## 🚀 Real-World Examples

### Example 1: VIP Customer Check
```
Trigger: "order_created" event
├─ Condition: {event.value} > 500
│  ├─ True: Send VIP confirmation email
│  └─ False: Send standard confirmation email
```

### Example 2: Promo Code Validation
```
Trigger: "order_created" event
├─ Get Promo Code
├─ Condition: {workflow.promoCode} = SUMMER20
│  ├─ True: Apply 20% discount
│  └─ False: Apply standard pricing
```

### Example 3: Email Domain Check
```
Trigger: "user_signup" event
├─ Condition: {event.userEmail} ⊃ @gmail.com
│  ├─ True: Send Gmail-specific welcome
│  └─ False: Send standard welcome
```

### Example 4: Age-Based Access Control
```
Trigger: "page_view" event
├─ Condition: {event.age} > 18
│  ├─ True: Show adult content
│  └─ False: Show family-friendly content
```

### Example 5: Item Category Targeting
```
Trigger: "order_created" event
├─ Condition: {event.itemCategory} = Package
│  ├─ True: Send package-specific confirmation
│  └─ False: Send standard confirmation
```

### Example 6: High-Value Order
```
Trigger: "order_created" event
├─ Condition: {event.value} > 1000
│  ├─ True: Send premium support notification
│  └─ False: Send standard support notification
```

## 🎨 Visual Workflow Builder

### Condition Node Appearance
- **Orange gradient** background
- **Question mark icon** to indicate decision point
- **Two output handles**:
  - Green handle (top) = True branch
  - Red handle (bottom) = False branch

### Property Panel Configuration
1. **Condition Type**: Choose from 6 comparison types
2. **Left Operand**: Variable or value to compare
3. **Right Operand**: Variable or value to compare against
4. **Description**: Optional description for clarity

### Live Preview
The property panel shows a live preview of your condition:
```
{event.userId} = user123
"Check if user is VIP"
```

## 🔍 Testing Your Conditions

### Test Cases
The system includes comprehensive testing for:
- ✅ Simple equals conditions
- ✅ Dynamic variable resolution
- ✅ Workflow context variables
- ✅ Contains/not contains logic
- ✅ Numeric comparisons
- ✅ False condition handling

### Debugging Tips
1. **Check Variable Names**: Ensure variables exist in your data
2. **Test with Static Values**: Start with simple values like `"test"`
3. **Use Preview**: The property panel shows the resolved condition
4. **Check Data Types**: Numbers vs strings matter for comparisons

## 🛠️ Troubleshooting

### Can't See Event Data in Variables?
If you can't see event data when configuring conditions:

1. **Check Node Selection**: Make sure you've selected the condition node
2. **Wait for Data Load**: The property panel needs a moment to load event data
3. **Refresh the Page**: Sometimes the data doesn't load on first visit
4. **Check Console**: Look for any JavaScript errors in the browser console

### Available Event Variables
When you click the variable picker in a condition node, you should see:
- **Event Data section** with variables like:
  - `userId` - User ID from the event
  - `value` - Numeric value from the event
  - `category` - Event category
  - `itemName` - Item name
  - `itemId` - Item ID
  - `itemCategory` - Item category
  - `userPhone` - User's phone number
  - `action` - Action performed
  - `path` - Page path
  - `pageTitle` - Page title

### Testing Event Variables
To test if event variables are working:
1. **Create a simple condition**: `{event.userId} = user123`
2. **Use the preview**: Check if the condition shows the correct values
3. **Test with static values**: Try `{event.userId} = test` to see if it resolves

## 🎯 Best Practices

### 1. Clear Naming
```javascript
// Good
{event.userId} = user123
"Check if user is VIP"

// Avoid
x = y
"Check"
```

### 2. Use Descriptive Variables
```javascript
// Good
{event.orderTotal} > 100
{workflow.promoCode} = SUMMER20

// Avoid
{event.v} > 100
{workflow.p} = SUMMER20
```

### 3. Test Both Branches
Always test both True and False paths to ensure your workflow works correctly.

### 4. Use Comments
Add descriptions to your conditions for clarity:
```
"Check if order value qualifies for free shipping"
"Validate promo code is valid"
"Check if user is in VIP segment"
```

## 🔧 Advanced Usage

### Complex Conditions
You can create complex workflows by chaining multiple condition nodes:

```
Trigger → Condition 1 → Condition 2 → Action
         ├─ True ──→ Condition 2
         └─ False ──→ Action B
```

### Multiple Branches
Connect different actions to True/False outputs:
```
Condition: {event.value} > 100
├─ True: Send premium notification
├─ False: Send standard notification
```

### Workflow Context
Use data from previous actions in your conditions:
```
Get Promo Code → Condition: {workflow.promoCode} = SUMMER20
                ├─ True: Apply discount
                └─ False: Continue without discount
```

## 🎉 What's Next?

This is the foundation for intelligent workflows. Future enhancements could include:
- **Multiple Conditions**: AND/OR logic
- **Nested Conditions**: Complex decision trees
- **Time-Based Conditions**: Date/time comparisons
- **External API Conditions**: Weather, stock prices, etc.
- **Machine Learning**: Predictive conditions

## 🚀 Getting Started

1. **Create a new workflow** or edit an existing one
2. **Drag a Condition node** from the Logic category
3. **Configure the condition** in the property panel
4. **Connect the branches** to different actions
5. **Test your workflow** with different data scenarios

The conditional logic feature makes your workflows truly intelligent and responsive to your business needs! 