const { PrismaClient } = require('@prisma/client');

async function checkPrismaModels() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Prisma Client models...\n');
    
    // Get all available models
    const models = Object.keys(prisma).filter(key => 
      typeof prisma[key] === 'object' && 
      prisma[key] !== null && 
      typeof prisma[key].findMany === 'function'
    );
    
    console.log('✅ Available Prisma models:');
    models.forEach(model => {
      console.log(`  - ${model}`);
    });
    
    // Check for specific new models
    const newModels = ['eventDefinition', 'businessMetric', 'knowledgeEntry'];
    console.log('\n🔍 Checking for new knowledge base models:');
    
    newModels.forEach(model => {
      if (models.includes(model)) {
        console.log(`  ✅ ${model} - Available`);
      } else {
        console.log(`  ❌ ${model} - Missing`);
      }
    });
    
    // Test a simple query on EventDefinition
    console.log('\n🧪 Testing EventDefinition query...');
    try {
      const count = await prisma.eventDefinition.count();
      console.log(`  ✅ EventDefinition.count() = ${count}`);
    } catch (error) {
      console.log(`  ❌ EventDefinition.count() failed:`, error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking Prisma models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrismaModels(); 