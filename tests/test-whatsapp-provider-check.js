#!/usr/bin/env node

/**
 * Check WhatsApp Provider Configuration
 * 
 * This script checks if a WhatsApp provider is configured
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWhatsAppProvider() {
  console.log('🔍 Checking WhatsApp provider configuration...\n');

  try {
    // Check if there are any WhatsApp providers
    const providers = await prisma.whatsAppProvider.findMany({
      include: {
        templates: true
      }
    });

    console.log(`📊 Found ${providers.length} WhatsApp provider(s):`);

    providers.forEach((provider, index) => {
      console.log(`\n${index + 1}. Provider: ${provider.displayName}`);
      console.log(`   - ID: ${provider.id}`);
      console.log(`   - Name: ${provider.providerName}`);
      console.log(`   - Active: ${provider.isActive}`);
      console.log(`   - Created: ${provider.createdAt}`);
      console.log(`   - Templates: ${provider.templates.length}`);
      
      // Show config fields (without sensitive data)
      const config = provider.config;
      if (config) {
        console.log(`   - Config fields: ${Object.keys(config).join(', ')}`);
      }
    });

    if (providers.length === 0) {
      console.log('\n❌ No WhatsApp providers configured');
      console.log('💡 You need to configure a WhatsApp provider first:');
      console.log('   1. Go to /whatsapp page');
      console.log('   2. Click "Configure" on Freshchat');
      console.log('   3. Enter your Freshchat credentials');
    } else {
      console.log('\n✅ WhatsApp provider is configured');
      console.log('💡 You can now test WhatsApp messages');
    }

  } catch (error) {
    console.error('❌ Error checking WhatsApp provider:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatsAppProvider().catch(console.error); 