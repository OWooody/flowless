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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // 'used' | 'unused' | 'all'
    const search = searchParams.get('search');

    // Verify batch belongs to user
    const batch = await prisma.promoCodeBatch.findFirst({
      where: {
        id: params.id,
        userId: session.userId,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      batchId: params.id,
    };

    if (status === 'used') {
      where.isUsed = true;
    } else if (status === 'unused') {
      where.isUsed = false;
    }

    if (search) {
      where.code = {
        contains: search.toUpperCase(),
      };
    }

    // Get total count
    const totalCount = await prisma.promoCode.count({ where });

    // Get codes with pagination
    const codes = await prisma.promoCode.findMany({
      where,
      select: {
        id: true,
        code: true,
        isUsed: true,
        usedAt: true,
        usedBy: true,
        orderId: true,
        discountAmount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      codes,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 