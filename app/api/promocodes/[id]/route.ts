import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = await prisma.promoCodeBatch.findFirst({
      where: {
        id: params.id,
        userId: session.userId,
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
        updatedAt: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      isActive 
    } = body;

    // Check if batch exists and belongs to user
    const existingBatch = await prisma.promoCodeBatch.findFirst({
      where: {
        id: params.id,
        userId: session.userId,
      },
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Validate discount value based on type
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 });
    }

    if (discountType === 'fixed' && discountValue < 0) {
      return NextResponse.json({ error: 'Fixed amount cannot be negative' }, { status: 400 });
    }

    const updatedBatch = await prisma.promoCodeBatch.update({
      where: {
        id: params.id,
      },
      data: {
        name: name || existingBatch.name,
        description: description !== undefined ? description : existingBatch.description,
        discountType: discountType || existingBatch.discountType,
        discountValue: discountValue !== undefined ? discountValue : existingBatch.discountValue,
        minOrderValue: minOrderValue !== undefined ? minOrderValue : existingBatch.minOrderValue,
        maxUses: maxUses !== undefined ? maxUses : existingBatch.maxUses,
        validFrom: validFrom ? new Date(validFrom) : existingBatch.validFrom,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : existingBatch.validUntil,
        isActive: isActive !== undefined ? isActive : existingBatch.isActive,
      },
    });

    return NextResponse.json({ batch: updatedBatch });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if batch exists and belongs to user
    const existingBatch = await prisma.promoCodeBatch.findFirst({
      where: {
        id: params.id,
        userId: session.userId,
      },
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Delete batch and all associated codes (cascade)
    await prisma.promoCodeBatch.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 