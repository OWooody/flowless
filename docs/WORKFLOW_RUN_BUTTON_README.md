# Workflow Run Button

## Overview
The workflow run button is a feature in the visual workflow builder that allows users to execute their workflows directly from the canvas.

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
- **Visual Feedback**: Clear indication of execution state through colors and animations

### 3. Test Data Input
- **User Input Required**: Users must provide test data in JSON format
- **No Default Data**: System doesn't create mock data automatically
- **Flexible Format**: Accepts any valid JSON structure for testing

## How It Works

### 1. **Save First**
- Workflow must be saved before running
- Run button is disabled until workflow is saved

### 2. **Provide Test Data**
- Click run button to start execution
- System prompts for test data input
- User provides JSON data for testing

### 3. **Execute Workflow**
- System validates the JSON input
- Executes workflow with provided test data
- Shows execution progress and results

### 4. **View Results**
- Execution history is logged
- Results are displayed in completion panel
- Detailed logs available in execution history

## Benefits

- **Real Testing**: Test with actual data structures
- **No Mock Data**: Users control what data to test with
- **Immediate Feedback**: See results instantly
- **Debugging**: Identify issues quickly
- **Validation**: Ensure workflow works with expected data

## Best Practices

1. **Test with Real Data**: Use data structures that match your actual use case
2. **Validate Input**: Ensure your test data is valid JSON
3. **Test Edge Cases**: Include boundary conditions and error scenarios
4. **Save Frequently**: Save your workflow before testing changes
5. **Check Logs**: Review execution history for detailed debugging information
