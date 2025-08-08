import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, codeType, specificCode } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Verify batch exists and belongs to user
    const batch = await prisma.promoCodeBatch.findFirst({
      where: {
        id: batchId,
        userId: session.userId,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check if batch is active and valid
    const now = new Date();
    if (!batch.isActive) {
      return NextResponse.json({ error: 'Batch is not active' }, { status: 400 });
    }

    if (batch.validFrom > now) {
      return NextResponse.json({ error: 'Batch is not yet valid' }, { status: 400 });
    }

    if (batch.validUntil && batch.validUntil < now) {
      return NextResponse.json({ error: 'Batch has expired' }, { status: 400 });
    }

    let promoCode;

    if (codeType === 'specific') {
      if (!specificCode) {
        return NextResponse.json({ error: 'Specific code is required' }, { status: 400 });
      }

      // Get the specific code
      promoCode = await prisma.promoCode.findFirst({
        where: {
          batchId: batchId,
          code: specificCode.toUpperCase(),
          isUsed: false,
        },
      });

      if (!promoCode) {
        return NextResponse.json({ error: 'Specific code not found or already used' }, { status: 404 });
      }
    } else if (codeType === 'sequential') {
      // Get the next available code (oldest unused)
      promoCode = await prisma.promoCode.findFirst({
        where: {
          batchId: batchId,
          isUsed: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } else {
      // Random code (default)
      // Get a random unused code
      const unusedCodes = await prisma.promoCode.findMany({
        where: {
          batchId: batchId,
          isUsed: false,
        },
      });

      if (unusedCodes.length === 0) {
        return NextResponse.json({ error: 'No unused codes available in this batch' }, { status: 404 });
      }

      // Select a random code
      const randomIndex = Math.floor(Math.random() * unusedCodes.length);
      promoCode = unusedCodes[randomIndex];
    }

    if (!promoCode) {
      return NextResponse.json({ error: 'No available codes in this batch' }, { status: 404 });
    }

    // Mark the code as used
    await prisma.promoCode.update({
      where: {
        id: promoCode.id,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: session.userId,
      },
    });

    // Update batch usage count
    await prisma.promoCodeBatch.update({
      where: {
        id: batchId,
      },
      data: {
        usedCodes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      code: promoCode.code,
      batchId: batchId,
      batchName: batch.name,
      discountType: batch.discountType,
      discountValue: batch.discountValue,
      minOrderValue: batch.minOrderValue,
    });
  } catch (error) {
    console.error('Error getting promo code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 