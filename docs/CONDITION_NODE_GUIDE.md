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

### How Testing Works
1. **Click Run Button**: Use the run button in the condition node
2. **Condition Evaluation**: System evaluates each branch condition
3. **Branch Highlighting**: Active branch is highlighted in green
4. **Real Data**: Uses actual data from previous nodes

### Testing Best Practices
1. **Test with Real Data**: Use actual data from your workflow
2. **Edge Cases**: Test boundary conditions and edge cases
3. **Multiple Scenarios**: Test different data combinations
4. **Error Handling**: Ensure conditions handle invalid data gracefully
5. **Performance**: Keep conditions simple and efficient

## 🚨 Best Practices

### ✅ Do's
1. **Keep it Simple**: Use clear, readable conditions
2. **Handle Edge Cases**: Consider null, undefined, and empty values
3. **Use Meaningful Names**: Name variables and functions clearly
4. **Test Thoroughly**: Test with various data scenarios
5. **Document Logic**: Add comments for complex conditions

### ❌ Don'ts
1. **Don't Overcomplicate**: Avoid deeply nested conditions
2. **Don't Ignore Errors**: Always handle potential errors
3. **Don't Hardcode Values**: Use variables and parameters
4. **Don't Skip Validation**: Validate input data before use
5. **Don't Forget Performance**: Consider execution time for complex logic

## 🔍 Troubleshooting

### Common Issues

#### 1. **Condition Always Returns False**
- Check if you're accessing the right data properties
- Verify data types (string vs number)
- Ensure proper comparison operators
- Check for null/undefined values

#### 2. **Condition Throws Errors**
- Add null checks before accessing nested properties
- Use optional chaining (`?.`) for safe access
- Validate data types before operations
- Handle edge cases gracefully

#### 3. **Branch Not Executing**
- Verify condition syntax is correct
- Check if condition evaluates to true
- Ensure proper logical operators
- Test with actual data values

#### 4. **Performance Issues**
- Simplify complex conditions
- Avoid expensive operations in conditions
- Use efficient data structures
- Consider caching frequently used values

### Debugging Tips
1. **Use Console Logs**: Add logging to see data values
2. **Test Incrementally**: Test one condition at a time
3. **Check Data Flow**: Verify data is reaching the condition node
4. **Review Logic**: Double-check your conditional logic
5. **Use Breakpoints**: Set breakpoints in complex conditions

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
