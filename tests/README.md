# Tests Directory

This directory contains various test files used during development to verify functionality.

## Test Categories

### Workflow Tests
- `test-workflow-*.js` - Workflow creation, editing, and navigation tests
- `test-execution-*.js` - Execution history and logging tests
- `test-visual-builder.js` - Visual workflow builder tests

### WhatsApp Tests
- `test-whatsapp-*.js` - WhatsApp integration and provider tests
- `test-freshchat-*.js` - Freshchat API and connection tests

### UI/UX Tests
- `test-smart-input-*.js` - Smart input component tests
- `test-data-picker-*.js` - Data picker functionality tests
- `test-trigger-*.js` - Trigger node tests

### Knowledge Base Tests
- `test-knowledge-*.js` - Knowledge base functionality tests
- `test-ai-*.js` - AI analytics and chat tests

### Debug Tests
- `test-debug-*.js` - Debug system tests
- `test-auth-*.js` - Authentication fix tests

## Usage

These tests can be run individually to verify specific functionality:

```bash
node tests/test-workflow-system.js
node tests/test-whatsapp-provider-system.js
```

## Note

These are development tests and may need updates as the codebase evolves. 