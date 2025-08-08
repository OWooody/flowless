const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Check if Event table exists and get its structure
    const eventTable = tables.find(t => t.table_name === 'Event');
    if (eventTable) {
      console.log('\n📊 Event table structure:');
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Event'
        ORDER BY ordinal_position;
      `;
      
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
      
      // Try to count events
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Event"`;
      console.log(`\n📈 Total events: ${count[0].count}`);
    } else {
      console.log('\n❌ Event table not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables(); 