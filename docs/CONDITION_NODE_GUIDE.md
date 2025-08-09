# Enhanced Condition Node Guide

## Overview

The Enhanced Condition Node is a powerful tool that allows you to create complex branching logic in your workflows using custom JavaScript code. Unlike simple if/else statements, this node supports multiple conditional branches with full control over evaluation order and execution flow.

## 🚀 Key Features

### Multi-Branch Support
- **If Branch**: Primary condition that's evaluated first
- **Else If Branches**: Multiple conditional branches with custom logic
- **Else Branch**: Default path when no conditions are met
- **Branch Reordering**: Drag and drop or use arrow buttons to reorder branches
- **Branch Activation**: Enable/disable individual branches without deleting them

### Smart Branch Management
- **Automatic Evaluation Order**: Branches are evaluated in sequence (If → Else If → Else)
- **First Match Wins**: First branch that returns `true` will execute
- **Branch Templates**: Pre-built condition templates for common use cases
- **Quick Actions**: One-click buttons for common condition patterns

## 🎯 Getting Started

### 1. Add a Condition Node
- Drag a Condition Node from the Node Palette to your workflow
- The node automatically creates an If and Else branch
- Connect input and output handles to other nodes

### 2. Configure Your First Condition
- Select the Condition Node to open the Property Panel
- Use the Quick Templates to get started quickly
- Or write custom JavaScript code in the If branch

### 3. Add More Branches
- Click "Add Else If Branch" to create additional conditional paths
- Each branch can have its own unique condition
- Reorder branches using the up/down arrow buttons

## 📝 Writing Conditions

### Basic Syntax
Each condition branch contains JavaScript code that must return `true` or `false`:

```javascript
// Simple age check
if (event.user.age >= 18) return true;
return false;

// Or more concise
return event.user.age >= 18;
```

### Available Variables

#### `event` - Current Trigger Data
```javascript
// User information
event.user.age
event.user.country
event.user.email
event.user.isVIP
event.user.tags

// Order information
event.order.total
event.order.status
event.order.items
event.order.shippingAddress

// Event metadata
event.timestamp
event.category
event.value
event.itemName
event.itemId
```

#### `workflow` - Workflow Configuration
```javascript
// Workflow settings
workflow.config.minAge
workflow.config.maxOrderValue
workflow.config.allowedCountries

// Custom variables
workflow.variables.promoCode
workflow.variables.discount
workflow.variables.businessHours
```

#### `execution` - Previous Execution Results
```javascript
// Previous workflow runs
execution[0].output
execution[0].timestamp
execution[0].success
```

## 🎨 Quick Templates

### Age Verification
```javascript
// Check if user meets age requirement
if (event.user && event.user.age >= 18) return true;
return false;
```

### VIP Customer Logic
```javascript
// Check VIP status or high order value
if (event.user && event.user.isVIP) return true;
if (event.order && event.order.total > 1000) return true;
return false;
```

### Country Filter
```javascript
// Check if user is in allowed countries
const allowedCountries = ['US', 'CA', 'UK'];
if (event.user && event.user.country && allowedCountries.includes(event.user.country)) return true;
return false;
```

### Order Status Check
```javascript
// Check if order is ready for processing
const validStatuses = ['pending', 'confirmed', 'processing'];
if (event.order && event.order.status && validStatuses.includes(event.order.status)) return true;
return false;
```

### Time-Based Conditions
```javascript
// Check if it's business hours (9 AM to 5 PM)
const hour = new Date().getHours();
if (hour >= 9 && hour < 17) return true;
return false;
```

## 🔧 Advanced Patterns

### Complex Business Rules
```javascript
// Multi-tier customer classification
if (event.user.age >= 18 && event.order.total > 1000) return 'gold';
if (event.user.age >= 18 && event.order.total > 500) return 'silver';
if (event.user.age >= 18 && event.order.total > 100) return 'bronze';
return 'standard';
```

### Data Validation
```javascript
// Comprehensive user validation
if (!event.user || !event.user.email) return false;
if (!event.user.email.includes('@')) return false;
if (event.user.age < 13) return false;
if (event.user.country === 'EU' && event.user.age < 16) return false;
return true;
```

### Array and String Operations
```javascript
// Check user tags
if (event.user.tags && event.user.tags.includes('premium')) return true;

// Check email domain
if (event.user.email && event.user.email.endsWith('@company.com')) return true;

// Check order items
if (event.order.items && event.order.items.length > 5) return true;
```

### External Data Integration
```javascript
// Check against external conditions
const currentHour = new Date().getHours();
const isBusinessHours = currentHour >= 9 && currentHour < 17;
const isWeekend = [0, 6].includes(new Date().getDay());

if (isBusinessHours && !isWeekend) return true;
if (event.user.isVIP) return true; // VIPs can order anytime
return false;
```

## 🎯 Branch Management

### Adding Branches
1. Click "Add Else If Branch" in the Property Panel
2. New branch is added with a default "return false;" condition
3. Customize the condition code as needed
4. Reorder branches using the up/down arrows

### Reordering Branches
- **Evaluation Order Matters**: Branches are evaluated from top to bottom
- **First True Wins**: Only the first branch that returns `true` will execute
- **Use Arrows**: Click ⬆️ to move up, ⬇️ to move down
- **Visual Feedback**: Branch numbers show evaluation order

### Branch Activation
- **Toggle Active/Inactive**: Click the circle button to enable/disable branches
- **Inactive Branches**: Won't be evaluated during execution
- **Temporary Disabling**: Useful for testing without deleting conditions

## 🧪 Testing Your Conditions

### Test Button
- Click "Test All Branches" to evaluate your conditions
- System runs each branch with sample data
- Shows which branch would execute
- Displays detailed results for each branch

### Sample Test Data
The test environment provides realistic sample data:
```javascript
{
  event: {
    user: { 
      age: 25, 
      country: 'US', 
      isVIP: true, 
      email: 'user@example.com' 
    },
    order: { 
      total: 150, 
      status: 'pending', 
      items: ['item1', 'item2'] 
    },
    timestamp: '2024-01-15T10:30:00Z',
    category: 'purchase',
    value: 150
  },
  workflow: {
    config: { 
      minAge: 18, 
      maxOrderValue: 1000, 
      allowedCountries: ['US', 'CA', 'UK'] 
    },
    variables: { 
      promoCode: 'SUMMER20', 
      discount: 0.1 
    }
  },
  execution: [
    { 
      output: { previousResult: 'success' }, 
      timestamp: '2024-01-15T10:25:00Z' 
    }
  ]
}
```

## 🚨 Best Practices

### 1. Always Return Boolean Values
```javascript
// ✅ Good - explicit return
if (event.user.age >= 18) return true;
return false;

// ✅ Good - direct return
return event.user.age >= 18;

// ❌ Bad - might return undefined
if (event.user.age >= 18) return true;
```

### 2. Handle Missing Data Safely
```javascript
// ✅ Good - safe property access
if (event.user && event.user.age >= 18) return true;

// ❌ Bad - might throw error
if (event.user.age >= 18) return true;
```

### 3. Use Clear Variable Names
```javascript
// ✅ Good - descriptive names
const minimumAge = workflow.config.minAge;
const userAge = event.user.age;
if (userAge >= minimumAge) return true;

// ❌ Bad - unclear names
if (event.user.age >= workflow.config.minAge) return true;
```

### 4. Comment Complex Logic
```javascript
// Check if user meets age and location requirements
if (event.user.age >= 18 && event.user.country === 'US') return true;

// Allow VIP customers regardless of age/location
if (event.user.isVIP) return true;

// Default: deny access
return false;
```

### 5. Test All Branches
- Always test both True and False paths
- Verify branch evaluation order
- Test with edge case data
- Ensure inactive branches don't interfere

## 🔍 Troubleshooting

### Common Issues

#### Syntax Errors
```javascript
// ❌ Missing closing parenthesis
if (event.user.age >= 18 return true;

// ✅ Correct syntax
if (event.user.age >= 18) return true;
```

#### Undefined Variables
```javascript
// ❌ Might fail if user object doesn't exist
if (event.user.age >= 18) return true;

// ✅ Safe access with existence check
if (event.user && event.user.age >= 18) return true;
```

#### Type Mismatches
```javascript
// ❌ Comparing string with number
if (event.user.age >= "18") return true;

// ✅ Convert to number
if (Number(event.user.age) >= 18) return true;
```

#### Branch Order Issues
```javascript
// ❌ More specific condition after general one
if (event.user.age >= 18) return true;
if (event.user.age >= 18 && event.user.isVIP) return true; // Never reached

// ✅ More specific condition first
if (event.user.age >= 18 && event.user.isVIP) return true;
if (event.user.age >= 18) return true;
```

### Debugging Tips

1. **Use console.log()**: Add logging to see what's happening
2. **Test Individual Branches**: Disable other branches to isolate issues
3. **Check Data Types**: Ensure you're comparing the right types
4. **Verify Branch Order**: Make sure conditions are in the right sequence
5. **Use Sample Data**: Test with the provided sample data first

## 🎉 What's Next?

The Enhanced Condition Node provides a solid foundation for complex workflow logic. Future enhancements could include:

- **Visual Condition Builder**: Drag-and-drop condition creation
- **Condition Libraries**: Save and reuse common conditions
- **Advanced Operators**: Regex, date comparisons, array operations
- **External API Conditions**: Real-time data integration
- **Machine Learning**: Predictive condition suggestions
- **Condition Analytics**: Track which branches execute most often

## 🚀 Getting Started Checklist

- [ ] Add a Condition Node to your workflow
- [ ] Connect input and output handles
- [ ] Choose a Quick Template or write custom code
- [ ] Test your condition with the Test button
- [ ] Add more branches if needed
- [ ] Reorder branches for proper evaluation
- [ ] Test all possible execution paths
- [ ] Deploy and monitor your workflow

The Enhanced Condition Node gives you the power to create intelligent, adaptive workflows that can handle complex business logic with ease. Start simple and gradually build more sophisticated conditions as you become comfortable with the system.
