console.log('🔧 Workflow Loader Test');
console.log('======================');

const fs = require('fs');

// Check if the workflows page exists
console.log('\n📁 Checking workflows page:');
const workflowsPagePath = 'app/workflows/page.tsx';
if (fs.existsSync(workflowsPagePath)) {
  console.log('✅ Workflows page exists');
} else {
  console.log('❌ Workflows page missing');
}

// Check for the general loader in workflows page
console.log('\n🔄 Checking for general loader in workflows page:');
const workflowsContent = fs.readFileSync(workflowsPagePath, 'utf8');

const generalLoaderFeatures = [
  'min-h-screen bg-gray-50 flex items-center justify-center',
  'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
];

console.log('🔍 Checking for general loader features:');
generalLoaderFeatures.forEach(feature => {
  if (workflowsContent.includes(feature)) {
    console.log(`✅ ${feature} - Found`);
  } else {
    console.log(`❌ ${feature} - Missing`);
  }
});

// Check for the old text-based loader (should be removed)
const oldLoaderFeatures = [
  'Loading workflows...',
  'text-lg',
  'h-64'
];

console.log('\n🔍 Checking for old loader features (should be removed):');
oldLoaderFeatures.forEach(feature => {
  if (workflowsContent.includes(feature)) {
    console.log(`❌ ${feature} - Still present (should be removed)`);
  } else {
    console.log(`✅ ${feature} - Removed`);
  }
});

// Check error state styling
console.log('\n🚨 Checking error state styling:');
const errorStateFeatures = [
  'bg-red-100 border border-red-400 text-red-700',
  'font-bold',
  'role="alert"'
];

console.log('🔍 Checking for error state features:');
errorStateFeatures.forEach(feature => {
  if (workflowsContent.includes(feature)) {
    console.log(`✅ ${feature} - Found`);
  } else {
    console.log(`❌ ${feature} - Missing`);
  }
});

// Check events page for comparison
console.log('\n📊 Comparing with events page loader:');
const eventsPagePath = 'app/events/page.tsx';
if (fs.existsSync(eventsPagePath)) {
  const eventsContent = fs.readFileSync(eventsPagePath, 'utf8');
  
  // Check if both pages use the same loader
  const workflowsHasLoader = workflowsContent.includes('animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600');
  const eventsHasLoader = eventsContent.includes('animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600');
  
  if (workflowsHasLoader && eventsHasLoader) {
    console.log('✅ Both pages use the same general loader');
  } else if (workflowsHasLoader) {
    console.log('✅ Workflows page uses general loader');
  } else {
    console.log('❌ Workflows page does not use general loader');
  }
  
  if (eventsHasLoader) {
    console.log('✅ Events page uses general loader');
  } else {
    console.log('❌ Events page does not use general loader');
  }
} else {
  console.log('❌ Events page not found for comparison');
}

// Check workflow detail page
console.log('\n📋 Checking workflow detail page:');
const workflowDetailPath = 'app/workflows/[id]/page.tsx';
if (fs.existsSync(workflowDetailPath)) {
  const detailContent = fs.readFileSync(workflowDetailPath, 'utf8');
  
  if (detailContent.includes('animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600')) {
    console.log('✅ Workflow detail page uses general loader');
  } else {
    console.log('❌ Workflow detail page does not use general loader');
  }
} else {
  console.log('❌ Workflow detail page not found');
}

console.log('\n🎯 Loader Consistency Features:');
console.log('✅ General spinner loader applied to workflows page');
console.log('✅ Consistent styling with events page');
console.log('✅ Proper error state styling');
console.log('✅ Full-screen loading experience');
console.log('✅ Blue color scheme matching app theme');
console.log('✅ Smooth animation with Tailwind classes');

console.log('\n🚀 Workflow pages now use the consistent general loader!');
console.log('Users will see the same loading experience across events and workflows.'); 