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
    const tag = searchParams.get('tag');
    const isActive = searchParams.get('isActive');

    const where: any = {
      userId: session.userId,
      isActive: isActive === 'false' ? false : true
    };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        has: tag
      };
    }

    const knowledgeEntries = await prisma.knowledgeEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(knowledgeEntries);
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
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
    const { title, content, tags, category } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category are required' }, { status: 400 });
    }

    const knowledgeEntry = await prisma.knowledgeEntry.create({
      data: {
        title,
        content,
        tags: tags || [],
        category,
        userId: session.userId,
        organizationId: session.orgId || null
      }
    });

    return NextResponse.json(knowledgeEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 