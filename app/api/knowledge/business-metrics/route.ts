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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {
      userId: session.userId,
      isActive: isActive === 'false' ? false : true
    };

    if (category) {
      where.category = category;
    }

    const businessMetrics = await prisma.businessMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(businessMetrics);
  } catch (error) {
    console.error('Error fetching business metrics:', error);
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
    const { name, description, formula, category, unit, examples } = body;

    if (!name || !description || !formula || !category) {
      return NextResponse.json({ error: 'Name, description, formula, and category are required' }, { status: 400 });
    }

    // Check if business metric already exists
    const existing = await prisma.businessMetric.findFirst({
      where: {
        name,
        userId: session.userId,
        isActive: true
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Business metric with this name already exists' }, { status: 409 });
    }

    const businessMetric = await prisma.businessMetric.create({
      data: {
        name,
        description,
        formula,
        category,
        unit: unit || null,
        examples: examples || null,
        userId: session.userId,
        organizationId: session.orgId || null
      }
    });

    return NextResponse.json(businessMetric, { status: 201 });
  } catch (error) {
    console.error('Error creating business metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 