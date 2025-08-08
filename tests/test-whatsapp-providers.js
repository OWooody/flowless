console.log('🔧 WhatsApp Providers Test');
console.log('==========================');

// Test the provider factory directly
const { whatsappProviderFactory } = require('./app/lib/whatsapp/providers/factory.ts');

console.log('\n🎯 Testing Provider Factory:');

try {
  // Test available providers
  const availableProviders = whatsappProviderFactory.getAvailableProviders();
  console.log('✅ Available providers:', availableProviders);

  // Test provider display names
  availableProviders.forEach(providerName => {
    const displayName = whatsappProviderFactory.getProviderDisplayName(providerName);
    console.log(`✅ ${providerName} display name: ${displayName}`);
  });

  // Test config fields
  availableProviders.forEach(providerName => {
    const configFields = whatsappProviderFactory.getProviderConfigFields(providerName);
    console.log(`✅ ${providerName} config fields:`, Object.keys(configFields));
  });

  // Test provider creation
  availableProviders.forEach(providerName => {
    try {
      const provider = whatsappProviderFactory.createProvider(providerName);
      console.log(`✅ Successfully created ${providerName} provider instance`);
      console.log(`   - Name: ${provider.getName()}`);
      console.log(`   - Display Name: ${provider.getDisplayName()}`);
    } catch (error) {
      console.log(`❌ Failed to create ${providerName} provider:`, error.message);
    }
  });

} catch (error) {
  console.log('❌ Error testing provider factory:', error.message);
}

console.log('\n🎯 Testing Service Layer:');

try {
  const { whatsappService } = require('./app/lib/whatsapp/service.ts');
  
  // Test service getAvailableProviders
  const serviceProviders = whatsappService.getAvailableProviders();
  console.log('✅ Service available providers:', serviceProviders);
  
  // Check structure
  if (Array.isArray(serviceProviders)) {
    console.log('✅ Service providers is an array');
    
    serviceProviders.forEach(provider => {
      console.log(`✅ Provider: ${provider.name}`);
      console.log(`   - Display Name: ${provider.displayName}`);
      console.log(`   - Config Fields: ${Object.keys(provider.configFields).join(', ')}`);
    });
  } else {
    console.log('❌ Service providers is not an array:', typeof serviceProviders);
  }

} catch (error) {
  console.log('❌ Error testing service layer:', error.message);
}

console.log('\n🚀 WhatsApp Providers Test - COMPLETED!'); 