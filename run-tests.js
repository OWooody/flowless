#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the test file name from command line arguments
const testFile = process.argv[2];

if (!testFile) {
  console.log('📋 Available Tests:');
  console.log('');
  
  // List all test files
  const testFiles = fs.readdirSync('./tests')
    .filter(file => file.endsWith('.js'))
    .sort();
  
  testFiles.forEach(file => {
    console.log(`  ${file}`);
  });
  
  console.log('');
  console.log('Usage: node run-tests.js <test-file-name>');
  console.log('Example: node run-tests.js test-workflow-system.js');
  process.exit(0);
}

// Check if the test file exists
const testPath = path.join('./tests', testFile);
if (!fs.existsSync(testPath)) {
  console.log(`❌ Test file not found: ${testFile}`);
  console.log('Run without arguments to see available tests.');
  process.exit(1);
}

// Run the test
console.log(`🧪 Running test: ${testFile}`);
console.log('');

try {
  require(testPath);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
} 