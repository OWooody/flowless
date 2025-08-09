# Condition Node Intellisense Guide

## Overview

The Condition Node has been enhanced with intelligent autocompletion (intellisense) that allows you to use previous node outputs in your condition expressions. This feature provides the same level of assistance as the Code Node, making it easier to write complex conditional logic.

## Features

### 🚀 Previous Node Outputs Access
- **Automatic Variable Detection**: All previous node outputs are automatically available as variables
- **Nested Property Access**: Access nested properties using dot notation (e.g., `user.profile.email`)
- **Array Support**: Full support for array operations and methods
- **Type Safety**: Intellisense shows the type and structure of available data

### 💡 Smart Autocompletion
- **JavaScript Operators**: Complete list of comparison and logical operators
- **Built-in Functions**: Array methods, string methods, and utility functions
- **Context-Aware Suggestions**: Suggestions based on the data types available
- **Real-time Updates**: Autocompletion updates as you type

### 🛡️ Safe Execution
- **Sandboxed Environment**: Conditions run in a safe, controlled context
- **Error Handling**: Graceful fallback for invalid expressions
- **No External Access**: Cannot access system resources or make network calls

## Usage Examples

### Basic Comparisons

```javascript
// Check user age
user.age > 18

// Verify user status
user.status === "active"

// Check boolean values
user.verified === true
```

### String Operations

```javascript
// String equality
user.name === "John Doe"

// String methods
user.email.includes("@")
user.name.startsWith("John")
user.name.endsWith("Doe")
```

### Array Operations

```javascript
// Check if array exists and has items
Array.isArray(products) && products.length > 0

// Check specific array items
products.includes("Product A")

// Array length checks
order.items.length >= 2
```

### Complex Conditions

```javascript
// Multiple conditions with AND
user.verified && user.status === "active" && user.age >= 18

// Multiple conditions with OR
user.status === "admin" || user.status === "moderator"

// Mixed logical operators
(user.verified || user.status === "guest") && order.total > 100
```

### Nested Property Access

```javascript
// Deep object properties
user.profile.preferences.theme === "dark"

// Mixed data types
order.customer.address.country === "US" && order.total > 50
```

## Available JavaScript Functions

### Array Functions
- `Array.isArray(value)` - Check if value is an array
- `array.length` - Get array length
- `array.includes(item)` - Check if array contains item
- `array.indexOf(item)` - Find item index

### String Functions
- `string.startsWith(prefix)` - Check string prefix
- `string.endsWith(suffix)` - Check string suffix
- `string.includes(substring)` - Check if string contains substring
- `string.length` - Get string length

### Utility Functions
- `typeof value` - Get value type
- `instanceof value` - Check object type
- `JSON.stringify(obj)` - Convert object to string
- `JSON.parse(str)` - Parse JSON string

## Workflow Integration

### 1. Node Output Storage
When other nodes (like Code Node, Action Node) execute, their outputs are automatically stored in the workflow context.

### 2. Variable Naming
Node outputs are stored using sanitized names:
- `"User Profile"` becomes `user_profile`
- `"Order Data"` becomes `order_data`
- `"Product List"` becomes `product_list`

### 3. Automatic Updates
The condition node automatically detects new variables and updates the autocompletion suggestions.

## Best Practices

### ✅ Do's
- Use descriptive node names for better variable identification
- Test conditions with the "Run Condition" button before deploying
- Use strict equality (`===`) for comparisons
- Leverage array and string methods for complex checks

### ❌ Don'ts
- Don't use complex JavaScript functions (they're not available)
- Don't rely on external APIs or system calls
- Don't use eval() or similar dangerous functions
- Don't create infinite loops or complex computations

## Troubleshooting

### Common Issues

1. **Variable Not Found**
   - Ensure the previous node has executed successfully
   - Check that the node name is properly set
   - Verify the workflow execution order

2. **Condition Always Returns False**
   - Check for typos in variable names
   - Verify data types match your expectations
   - Use console.log in Code Node to debug data structure

3. **Autocompletion Not Working**
   - Ensure you have previous node outputs
   - Check that the condition field is focused
   - Try typing a few characters to trigger suggestions

### Debug Tips

- Use the "Run Condition" button to test expressions
- Check the workflow context for available variables
- Review node execution logs for data flow issues
- Test conditions with simple expressions first

## Migration from Old Condition Node

The enhanced condition node is fully backward compatible. Existing workflows will continue to work without changes. New features are automatically available:

- **Existing Conditions**: Continue to work as before
- **New Variables**: Automatically appear in autocompletion
- **Enhanced Evaluation**: Better error handling and debugging

## Performance Considerations

- **Lightweight**: Condition evaluation is fast and efficient
- **Cached Results**: Autocompletion suggestions are cached for performance
- **Minimal Memory**: Only stores necessary data for evaluation
- **Scalable**: Handles large numbers of variables efficiently

## Future Enhancements

Planned improvements for upcoming versions:

- **Type Inference**: Better type checking and validation
- **Custom Functions**: User-defined helper functions
- **Condition Templates**: Pre-built condition patterns
- **Advanced Operators**: More sophisticated comparison operators
- **Visual Condition Builder**: Drag-and-drop condition creation

## Support

For issues or questions about the enhanced condition node:

1. Check this documentation first
2. Review the test files in the `tests/` directory
3. Check the workflow execution logs
4. Verify node output data structure
5. Test with simple conditions first

---

*This guide covers the enhanced condition node features. For general workflow usage, see the main [README.md](../README.md).*
