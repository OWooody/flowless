import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batches = await prisma.promoCodeBatch.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        totalCodes: true,
        usedCodes: true,
        discountType: true,
        discountValue: true,
        minOrderValue: true,
        maxUses: true,
        validFrom: true,
        validUntil: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      batches,
      summary: {
        total: batches.length,
        active: batches.filter(b => b.isActive).length,
        inactive: batches.filter(b => !b.isActive).length,
        totalCodes: batches.reduce((sum, b) => sum + b.totalCodes, 0),
        usedCodes: batches.reduce((sum, b) => sum + b.usedCodes, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching promo code batches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      discountType, 
      discountValue, 
      minOrderValue, 
      maxUses, 
      validFrom, 
      validUntil, 
      isActive,
      codes 
    } = body;

    if (!name || !discountType || !discountValue || !codes || codes.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate discount value based on type
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 });
    }

    if (discountType === 'fixed' && discountValue < 0) {
      return NextResponse.json({ error: 'Fixed amount cannot be negative' }, { status: 400 });
    }

    // Check for duplicate codes
    const existingCodes = await prisma.promoCode.findMany({
      where: {
        code: {
          in: codes,
        },
      },
      select: {
        code: true,
      },
    });

    if (existingCodes.length > 0) {
      const duplicateCodes = existingCodes.map(c => c.code).join(', ');
      return NextResponse.json({ 
        error: `Duplicate codes found: ${duplicateCodes}` 
      }, { status: 400 });
    }

    // Create batch and codes in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the batch
      const batch = await tx.promoCodeBatch.create({
        data: {
          name,
          description: description || null,
          discountType,
          discountValue,
          minOrderValue: minOrderValue || null,
          maxUses: maxUses || null,
          validFrom: new Date(validFrom),
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: isActive !== false,
          totalCodes: codes.length,
          userId: session.userId,
          organizationId: session.orgId || null,
        },
      });

      // Create all promo codes
      const promoCodeData = codes.map((code: string) => ({
        code: code.trim().toUpperCase(),
        batchId: batch.id,
      }));

      await tx.promoCode.createMany({
        data: promoCodeData,
      });

      return batch;
    });

    return NextResponse.json({ 
      batch: result,
      message: `Successfully created batch with ${codes.length} codes`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating promo code batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 