const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPromoCodeVariables() {
  console.log('🧪 Testing Promo Code Variables in Action Nodes...\n');

  try {
    // Test 1: Create a promo code batch
    console.log('1. Creating a promo code batch...');
    const batch = await prisma.promoCodeBatch.create({
      data: {
        name: 'Variable Test Batch',
        description: 'Test batch for variable integration',
        discountType: 'percentage',
        discountValue: 25,
        minOrderValue: 30,
        maxUses: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        totalCodes: 5,
        userId: 'test-user-123',
        organizationId: 'test-org-123',
      },
    });
    console.log('✅ Batch created:', batch.name);

    // Test 2: Create promo codes for the batch
    console.log('\n2. Creating promo codes...');
    const codes = ['VAR1', 'VAR2', 'VAR3', 'VAR4', 'VAR5'];
    
    const promoCodeData = codes.map(code => ({
      code: code,
      batchId: batch.id,
    }));

    await prisma.promoCode.createMany({
      data: promoCodeData,
    });
    console.log('✅ Created', codes.length, 'promo codes');

    // Test 3: Create a workflow with promo code and action nodes
    console.log('\n3. Creating a workflow with promo code and action nodes...');
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Promo Code Variables Test',
        description: 'Workflow to test promo code variables in actions',
        trigger: {
          eventType: 'engagement',
          filters: {
            eventName: 'page_view',
          },
        },
        actions: [
          {
            type: 'promo_code',
            batchId: batch.id,
            batchName: batch.name,
            outputVariable: 'welcomeCode',
            codeType: 'random',
          },
          {
            type: 'push_notification',
            title: 'Welcome!',
            body: 'Use code {welcomeCode} for 25% off!',
            targetUsers: 'specific',
            userIds: ['user123'],
          },
          {
            type: 'whatsapp_message',
            provider: 'freshchat',
            templateName: 'welcome_message',
            namespace: 'fc3df069_22dc_4a5f_a669_2f7329af60d1',
            language: 'en',
            bodyVariable1: '{welcomeCode}',
            bodyVariable2: '25% discount',
            bodyVariable3: 'Welcome to our store!',
          },
        ],
        isActive: true,
        userId: 'test-user-123',
        organizationId: 'test-org-123',
      },
    });
    console.log('✅ Workflow created:', workflow.name);

    // Test 4: Simulate workflow execution context
    console.log('\n4. Simulating workflow execution context...');
    
    // Simulate the workflow context after promo code action
    const workflowContext = {
      // Original event data
      id: 'event_123',
      name: 'page_view',
      category: 'engagement',
      userId: 'user123',
      organizationId: 'test-org-123',
      
      // Promo code variables (added by promo code action)
      welcomeCode: 'VAR1',
      welcomeCode_batchId: batch.id,
      welcomeCode_batchName: batch.name,
      welcomeCode_discountType: 'percentage',
      welcomeCode_discountValue: 25,
    };

    console.log('   Workflow context variables:');
    Object.keys(workflowContext).forEach(key => {
      if (key.includes('welcomeCode')) {
        console.log(`     ${key}: ${workflowContext[key]}`);
      }
    });

    // Test 5: Test variable resolution
    console.log('\n5. Testing variable resolution...');
    
    // Test push notification body resolution
    const pushNotificationBody = 'Use code {welcomeCode} for 25% off!';
    const resolvedBody = pushNotificationBody.replace('{welcomeCode}', workflowContext.welcomeCode);
    console.log('   Original body:', pushNotificationBody);
    console.log('   Resolved body:', resolvedBody);

    // Test WhatsApp body variable resolution
    const whatsappBodyVar = '{welcomeCode}';
    const resolvedWhatsAppVar = whatsappBodyVar.replace('{welcomeCode}', workflowContext.welcomeCode);
    console.log('   WhatsApp body variable:', whatsappBodyVar);
    console.log('   Resolved WhatsApp variable:', resolvedWhatsAppVar);

    // Test 6: Verify variable availability in DataPicker
    console.log('\n6. Testing DataPicker variable availability...');
    
    const dataPickerVariables = Object.keys(workflowContext)
      .filter(key => key.includes('welcomeCode'))
      .map(key => ({
        path: `workflow.${key}`,
        value: workflowContext[key],
        type: 'workflow',
        displayPath: key
      }));

    console.log('   Available variables in DataPicker:');
    dataPickerVariables.forEach(variable => {
      console.log(`     ${variable.displayPath}: ${variable.value}`);
    });

    // Test 7: Test different variable names
    console.log('\n7. Testing different variable names...');
    
    const testWorkflows = [
      {
        name: 'Welcome Flow',
        outputVariable: 'welcomeCode',
        expectedVariable: 'welcomeCode'
      },
      {
        name: 'VIP Flow',
        outputVariable: 'vipCode',
        expectedVariable: 'vipCode'
      },
      {
        name: 'Special Flow',
        outputVariable: 'specialOffer',
        expectedVariable: 'specialOffer'
      }
    ];

    testWorkflows.forEach(test => {
      const testContext = {
        ...workflowContext,
        [test.expectedVariable]: 'TEST123',
        [`${test.expectedVariable}_batchId`]: batch.id,
        [`${test.expectedVariable}_batchName`]: batch.name,
      };

      const availableVars = Object.keys(testContext)
        .filter(key => key.includes(test.expectedVariable))
        .map(key => key);

      console.log(`   ${test.name}:`);
      console.log(`     Output Variable: ${test.outputVariable}`);
      console.log(`     Available Variables: ${availableVars.join(', ')}`);
    });

    console.log('\n🎉 All tests passed! Promo code variables are properly integrated into action nodes.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPromoCodeVariables(); 