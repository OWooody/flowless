# Workflow Run Button

## Overview
The workflow run button is a new feature added to the visual workflow builder that allows users to execute their workflows directly from the canvas.

## Features

### 1. Run Button
- **Location**: Bottom-right corner of the canvas, above the save button
- **Appearance**: Green circular button with a play icon
- **State**: 
  - **Enabled**: Green when workflow is saved and ready to run
  - **Disabled**: Gray when workflow hasn't been saved yet
  - **Running**: Shows a spinning loader when execution is in progress

### 2. Execution Status
- **Running Indicator**: Green floating panel on the left side showing "Executing workflow..."
- **Completion Panel**: Detailed execution results panel after successful completion
- **Visual Feedback**: Clear indication of execution state throughout the process

### 3. Execution Results
After a successful workflow execution, users see:
- **Execution ID**: Unique identifier for the execution
- **Duration**: Total execution time in milliseconds
- **Actions Count**: Number of actions that were executed
- **View History Button**: Direct link to execution history page

## How It Works

### Prerequisites
1. **Workflow Must Be Saved**: The run button is only enabled after the workflow has been saved to the database
2. **Valid Workflow Structure**: The workflow must have at least a trigger node

### Execution Process
1. **Click Run Button**: User clicks the green run button
2. **Validation**: System checks if workflow is saved and ready
3. **Test Event Creation**: A test event is automatically generated with sample data
4. **API Call**: The workflow is executed via the `/api/workflows/[id]/test` endpoint
5. **Execution**: The workflow service processes the workflow step by step
6. **Result Display**: Execution results are shown in a floating panel

### Test Event Data
The system automatically creates a test event with:
```json
{
  "name": "manual_test_event",
  "category": "engagement",
  "itemName": "test_item",
  "itemCategory": "test_category",
  "value": 100,
  "userId": "test_user",
  "organizationId": "test_org",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## User Experience

### Before Execution
- Run button is disabled (gray) with tooltip "Save workflow first to run it"
- "Ready to Run" badge appears on workflow name when saved

### During Execution
- Run button shows spinning loader
- "Executing workflow..." status panel appears
- Button is disabled to prevent multiple executions

### After Execution
- Success alert with execution details
- Floating result panel with execution summary
- Direct link to view full execution history
- Run button returns to enabled state

## Technical Implementation

### State Management
- `isRunning`: Tracks execution state
- `lastExecutionResult`: Stores last execution results
- `editWorkflowId`: Identifies if workflow is saved

### API Integration
- Uses existing `/api/workflows/[id]/test` endpoint
- Leverages existing workflow execution service
- Integrates with execution history system

### Error Handling
- Comprehensive error messages for failed executions
- Graceful fallback for API errors
- User-friendly error alerts

## Benefits

1. **Immediate Testing**: Users can test workflows without leaving the builder
2. **Visual Feedback**: Clear indication of execution progress and results
3. **Quick Validation**: Verify workflow logic before deployment
4. **Seamless Integration**: Works with existing execution and history systems
5. **User-Friendly**: Simple one-click execution with comprehensive feedback

## Future Enhancements

1. **Custom Test Data**: Allow users to input custom test event data
2. **Execution Preview**: Show step-by-step execution in real-time
3. **Performance Metrics**: Display detailed performance analytics
4. **Debug Mode**: Enhanced debugging capabilities for complex workflows
5. **Batch Execution**: Run multiple test scenarios at once

## Troubleshooting

### Common Issues
1. **Button Disabled**: Ensure workflow is saved first
2. **Execution Fails**: Check workflow configuration and node connections
3. **No Results**: Verify workflow has actions configured
4. **API Errors**: Check network connectivity and authentication

### Debug Steps
1. Check browser console for error messages
2. Verify workflow structure and connections
3. Ensure all required node configurations are complete
4. Check execution history for detailed error logs
