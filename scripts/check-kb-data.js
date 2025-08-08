// Script to check knowledge base data directly from database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkKnowledgeBaseData() {
  console.log('🔍 Checking Knowledge Base Data...\n');

  try {
    // Check event definitions
    const eventDefinitions = await prisma.eventDefinition.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('📊 Event Definitions:');
    console.log(`  Total: ${eventDefinitions.length}`);
    
    if (eventDefinitions.length > 0) {
      eventDefinitions.forEach((ed, index) => {
        console.log(`  ${index + 1}. "${ed.name}" - ${ed.description} (Category: ${ed.category})`);
        console.log(`     User ID: ${ed.userId}`);
        console.log(`     Created: ${ed.createdAt}`);
        if (ed.properties) {
          console.log(`     Properties: ${JSON.stringify(ed.properties)}`);
        }
        console.log('');
      });
    } else {
      console.log('  ⚠️  No event definitions found in database');
    }

    // Check business metrics
    const businessMetrics = await prisma.businessMetric.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('📈 Business Metrics:');
    console.log(`  Total: ${businessMetrics.length}`);
    
    if (businessMetrics.length > 0) {
      businessMetrics.forEach((bm, index) => {
        console.log(`  ${index + 1}. "${bm.name}" - ${bm.description}`);
        console.log(`     Category: ${bm.category}`);
        console.log(`     User ID: ${bm.userId}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  No business metrics found in database');
    }

    // Check knowledge entries
    const knowledgeEntries = await prisma.knowledgeEntry.findMany({
      orderBy: { title: 'asc' }
    });

    console.log('📚 Knowledge Entries:');
    console.log(`  Total: ${knowledgeEntries.length}`);
    
    if (knowledgeEntries.length > 0) {
      knowledgeEntries.forEach((ke, index) => {
        console.log(`  ${index + 1}. "${ke.title}" - ${ke.category}`);
        console.log(`     User ID: ${ke.userId}`);
        console.log(`     Tags: ${ke.tags.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  No knowledge entries found in database');
    }

  } catch (error) {
    console.error('❌ Error checking knowledge base data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnowledgeBaseData(); 