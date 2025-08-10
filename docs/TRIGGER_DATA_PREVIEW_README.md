# Trigger Data Preview Functionality

## Overview

The Trigger Data Preview feature allows you to make trigger data available in the workflow context without running the workflow. This enables you to test conditions, see autocompletion suggestions, and validate your workflow logic in real-time.

## How It Works

### 1. Automatic Preview on Input Change
- When you type in the test data field of a TriggerNode, trigger data is automatically generated and made available in the context
- This happens in real-time as you type, providing immediate feedback
- No need to manually click preview buttons

### 2. Preview Data Structure
The preview trigger data includes:
```javascript
{
  type: 'webhook', // or 'schedule', 'manual'
  eventType: 'preview',
  description: 'Preview trigger data (workflow not executed)',
  data: { /* your test data */ },
  timestamp: '2024-01-01T00:00:00.000Z',
  nodeId: 'trigger-preview',
  nodeLabel: 'Trigger Preview',
  testData: { /* your test data */ },
  isPreview: true // indicates this is preview data, not from execution
}
```

### 3. Context Availability
- Trigger data is immediately available in `previousNodeOutputs.trigger`
- All condition nodes can access this data for testing
- Autocompletion in condition editors shows trigger data properties
- No workflow execution required

## Usage

### In TriggerNode
1. **Test Data Field**: Enter JSON or simple values
2. **Auto-Preview**: Data is automatically available in context
3. **Manual Preview**: Click "👁️ Preview Data" button for explicit preview
4. **Run Workflow**: Click "▶ Run Workflow" to actually execute

### In ConditionNode
1. **Trigger Data Status**: Blue box shows when trigger data is available
2. **Preview Mode Indicator**: Shows "(Preview Mode)" for preview data
3. **Autocompletion**: Type `trigger.` to see available properties
4. **Condition Testing**: Write conditions using trigger data
5. **Clear Data**: Click "Clear Trigger Data" when done testing

## Performance Benefits

### Lightweight Implementation
- No API calls or database operations
- Uses React state management only
- Minimal memory footprint
- Instant response time

### Smart Updates
- Only updates when test data changes
- Avoids unnecessary re-renders
- Efficient context propagation

## Example Workflow

1. **Setup Trigger**: Configure trigger type and test data
2. **Preview Data**: See trigger data automatically appear in context
3. **Test Conditions**: Write conditions using `trigger.data.userId === "123"`
4. **Validate Logic**: Ensure your workflow branches work correctly
5. **Run Workflow**: Execute with confidence that conditions are correct

## Code Examples

### Basic Condition
```javascript
// Check if user ID exists and action is login
trigger.data.userId && trigger.data.action === "login"
```

### Complex Condition
```javascript
// Check multiple conditions with logical operators
trigger.data.userId === "123" && 
trigger.data.action === "login" && 
trigger.data.timestamp > "2024-01-01"
```

### Array Operations
```javascript
// Check if user has required permissions
Array.isArray(trigger.data.permissions) && 
trigger.data.permissions.includes("admin")
```

## Benefits

✅ **No Workflow Execution Required**: Test conditions instantly
✅ **Real-time Feedback**: See data changes as you type
✅ **Performance Optimized**: Lightweight and fast
✅ **Developer Friendly**: Intuitive autocompletion and validation
✅ **Cost Effective**: No API calls or execution costs
✅ **Safe Testing**: Validate logic without affecting production data

## Technical Implementation

### WorkflowContext Functions
- `previewTriggerData(testData, triggerType)`: Generate preview data
- `clearPreviewData()`: Remove preview data from context
- `addTriggerData(triggerData)`: Add execution data (existing)

### Auto-Preview Logic
- Triggers on test data input changes
- Handles JSON parsing gracefully
- Falls back to default data for empty input
- Updates context immediately

### Context Integration
- Seamlessly integrates with existing workflow system
- Maintains backward compatibility
- No changes required to existing nodes
- Enhanced autocompletion and validation

## Troubleshooting

### No Trigger Data Showing
- Check if TriggerNode has test data
- Verify WorkflowProvider is wrapping your components
- Look for console errors

### Autocompletion Not Working
- Ensure trigger data is in context
- Check if condition editor is focused
- Verify CodeMirror extensions are loaded

### Performance Issues
- Trigger data updates are lightweight
- No network requests or heavy computations
- If issues persist, check for infinite loops in other components

## Future Enhancements

- **Data Templates**: Pre-built test data templates for common scenarios
- **Validation Rules**: Schema validation for test data
- **History**: Remember previous test data sets
- **Export/Import**: Save and load test data configurations
- **Real-time Execution**: Live preview of workflow execution path
