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

    const eventDefinitions = await prisma.eventDefinition.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(eventDefinitions);
  } catch (error) {
    console.error('Error fetching event definitions:', error);
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
    const { name, description, category, properties, examples } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Name, description, and category are required' }, { status: 400 });
    }

    // Check if event definition already exists
    const existing = await prisma.eventDefinition.findFirst({
      where: {
        name,
        userId: session.userId,
        isActive: true
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Event definition with this name already exists' }, { status: 409 });
    }

    const eventDefinition = await prisma.eventDefinition.create({
      data: {
        name,
        description,
        category,
        properties: properties || null,
        examples: examples || null,
        userId: session.userId,
        organizationId: session.orgId || null
      }
    });

    return NextResponse.json(eventDefinition, { status: 201 });
  } catch (error) {
    console.error('Error creating event definition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 