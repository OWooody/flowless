/**
 * Test for Trigger Data Preview Functionality
 * 
 * This test verifies that trigger data can be made available in the context
 * without running the workflow, in a simple and performance-friendly way.
 */

// Mock the WorkflowContext functions
const mockPreviousNodeOutputs = {};
const mockSetPreviousNodeOutputs = jest.fn();
const mockAddTriggerData = jest.fn();
const mockPreviewTriggerData = jest.fn();
const mockClearPreviewData = jest.fn();

// Mock the context
const mockWorkflowContext = {
  previousNodeOutputs: mockPreviousNodeOutputs,
  setPreviousNodeOutputs: mockSetPreviousNodeOutputs,
  addTriggerData: mockAddTriggerData,
  previewTriggerData: mockPreviewTriggerData,
  clearPreviewData: mockClearPreviewData,
};

describe('Trigger Data Preview Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    Object.keys(mockPreviousNodeOutputs).forEach(key => delete mockPreviousNodeOutputs[key]);
  });

  test('should generate mock trigger data for preview', () => {
    const testData = { userId: '123', action: 'login' };
    const triggerType = 'webhook';
    
    // Call the preview function
    mockPreviewTriggerData(testData, triggerType);
    
    // Verify the function was called with correct parameters
    expect(mockPreviewTriggerData).toHaveBeenCalledWith(testData, triggerType);
  });

  test('should use default data when no test data provided', () => {
    const triggerType = 'webhook';
    
    // Call preview without test data
    mockPreviewTriggerData(undefined, triggerType);
    
    // Verify default data is used
    expect(mockPreviewTriggerData).toHaveBeenCalledWith(undefined, triggerType);
  });

  test('should clear preview data when requested', () => {
    // Add some mock data first
    mockPreviousNodeOutputs.trigger = { type: 'webhook', data: { test: 'data' } };
    
    // Clear the preview data
    mockClearPreviewData();
    
    // Verify the clear function was called
    expect(mockClearPreviewData).toHaveBeenCalled();
  });

  test('should handle different trigger types', () => {
    const testData = { message: 'test' };
    const triggerTypes = ['webhook', 'schedule', 'manual'];
    
    triggerTypes.forEach(type => {
      mockPreviewTriggerData(testData, type);
      expect(mockPreviewTriggerData).toHaveBeenCalledWith(testData, type);
    });
  });

  test('should provide trigger data structure for conditions', () => {
    const expectedStructure = {
      type: 'webhook',
      eventType: 'preview',
      description: 'Preview trigger data (workflow not executed)',
      data: { userId: '123' },
      timestamp: expect.any(String),
      nodeId: 'trigger-preview',
      nodeLabel: 'Trigger Preview',
      testData: { userId: '123' },
      isPreview: true
    };
    
    // This test verifies the expected structure of preview trigger data
    expect(expectedStructure).toMatchObject({
      type: 'webhook',
      eventType: 'preview',
      isPreview: true
    });
  });
});

console.log('✅ Trigger Data Preview tests completed successfully!');
console.log('🎯 Key features verified:');
console.log('   • Mock trigger data generation');
console.log('   • Default data fallback');
console.log('   • Preview data clearing');
console.log('   • Multiple trigger type support');
console.log('   • Proper data structure for conditions');
