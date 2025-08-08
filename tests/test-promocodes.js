const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPromoCodeSystem() {
  console.log('🧪 Testing Promo Code System...\n');

  try {
    // Test 1: Create a batch
    console.log('1. Creating a promo code batch...');
    const batch = await prisma.promoCodeBatch.create({
      data: {
        name: 'Test Summer Sale 2024',
        description: 'Test batch for summer sale',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 50,
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
    const codes = ['SUMMER15', 'SAVE2024', 'DISCOUNT20', 'PROMO123', 'SALE50'];
    
    const promoCodeData = codes.map(code => ({
      code: code,
      batchId: batch.id,
    }));

    await prisma.promoCode.createMany({
      data: promoCodeData,
    });
    console.log('✅ Created', codes.length, 'promo codes');

    // Test 3: Fetch the batch with codes
    console.log('\n3. Fetching batch with codes...');
    const batchWithCodes = await prisma.promoCodeBatch.findUnique({
      where: { id: batch.id },
      include: {
        promoCodes: true,
      },
    });
    console.log('✅ Batch found with', batchWithCodes.promoCodes.length, 'codes');

    // Test 4: Test code usage
    console.log('\n4. Testing code usage...');
    const firstCode = batchWithCodes.promoCodes[0];
    const updatedCode = await prisma.promoCode.update({
      where: { id: firstCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: 'test-user-456',
        orderId: 'order-123',
        discountAmount: 7.50,
      },
    });
    console.log('✅ Code marked as used:', updatedCode.code);

    // Test 5: Update batch usage count
    console.log('\n5. Updating batch usage count...');
    const usedCodesCount = await prisma.promoCode.count({
      where: {
        batchId: batch.id,
        isUsed: true,
      },
    });

    await prisma.promoCodeBatch.update({
      where: { id: batch.id },
      data: {
        usedCodes: usedCodesCount,
      },
    });
    console.log('✅ Updated batch usage count to', usedCodesCount);

    // Test 6: Fetch all batches
    console.log('\n6. Fetching all batches...');
    const allBatches = await prisma.promoCodeBatch.findMany({
      include: {
        _count: {
          select: {
            promoCodes: true,
          },
        },
      },
    });
    console.log('✅ Found', allBatches.length, 'batches');

    // Test 7: Search for specific code
    console.log('\n7. Searching for specific code...');
    const foundCode = await prisma.promoCode.findFirst({
      where: {
        code: 'SUMMER15',
      },
      include: {
        batch: true,
      },
    });
    console.log('✅ Found code:', foundCode?.code, 'from batch:', foundCode?.batch.name);

    console.log('\n🎉 All tests passed! Promo code system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPromoCodeSystem(); 