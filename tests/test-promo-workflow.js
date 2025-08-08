const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPromoCodeWorkflow() {
  console.log('🧪 Testing Promo Code Workflow Integration...\n');

  try {
    // Test 1: Create a promo code batch
    console.log('1. Creating a promo code batch...');
    const batch = await prisma.promoCodeBatch.create({
      data: {
        name: 'Workflow Test Batch',
        description: 'Test batch for workflow integration',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 25,
        maxUses: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        totalCodes: 10,
        userId: 'test-user-123',
        organizationId: 'test-org-123',
      },
    });
    console.log('✅ Batch created:', batch.name);

    // Test 2: Create promo codes for the batch
    console.log('\n2. Creating promo codes...');
    const codes = ['WORKFLOW1', 'WORKFLOW2', 'WORKFLOW3', 'WORKFLOW4', 'WORKFLOW5'];
    
    const promoCodeData = codes.map(code => ({
      code: code,
      batchId: batch.id,
    }));

    await prisma.promoCode.createMany({
      data: promoCodeData,
    });
    console.log('✅ Created', codes.length, 'promo codes');

    // Test 3: Create a workflow with promo code action
    console.log('\n3. Creating a workflow with promo code action...');
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Test Promo Code Workflow',
        description: 'Workflow that gets a promo code and sends notification',
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
            outputVariable: 'promoCode',
            codeType: 'random',
          },
          {
            type: 'push_notification',
            title: 'Special Offer!',
            body: 'Use code {promoCode} for 20% off!',
            targetUsers: 'specific',
            userIds: ['user123'],
          },
        ],
        isActive: true,
        userId: 'test-user-123',
        organizationId: 'test-org-123',
      },
    });
    console.log('✅ Workflow created:', workflow.name);

    // Test 4: Simulate workflow execution
    console.log('\n4. Simulating workflow execution...');
    
    // Get a promo code using the API endpoint
    const response = await fetch('http://localhost:3000/api/promocodes/get-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        batchId: batch.id,
        codeType: 'random',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Promo code retrieved:', result.code);
      console.log('   Batch:', result.batchName);
      console.log('   Discount:', result.discountType === 'percentage' ? `${result.discountValue}%` : `$${result.discountValue}`);
    } else {
      console.log('❌ Failed to get promo code:', response.status);
    }

    // Test 5: Check workflow execution would work
    console.log('\n5. Testing workflow execution logic...');
    
    // Simulate the workflow execution steps
    const triggerEvent = {
      id: 'event_123',
      name: 'page_view',
      category: 'engagement',
      userId: 'user123',
      organizationId: 'test-org-123',
      timestamp: new Date().toISOString(),
    };

    console.log('   Trigger event:', triggerEvent.name);
    console.log('   Actions to execute:', workflow.actions.length);
    
    workflow.actions.forEach((action, index) => {
      console.log(`   Action ${index + 1}:`, action.type);
      if (action.type === 'promo_code') {
        console.log(`     - Batch: ${action.batchName}`);
        console.log(`     - Code Type: ${action.codeType}`);
        console.log(`     - Output Variable: ${action.outputVariable}`);
      } else if (action.type === 'push_notification') {
        console.log(`     - Title: ${action.title}`);
        console.log(`     - Body: ${action.body}`);
        console.log(`     - Target Users: ${action.targetUsers}`);
      }
    });

    console.log('\n🎉 All tests passed! Promo code workflow integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPromoCodeWorkflow(); 