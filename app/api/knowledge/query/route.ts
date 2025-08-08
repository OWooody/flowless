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
    const query = searchParams.get('q'); // Search query
    const category = searchParams.get('category');

    // Build search conditions
    const where: any = {
      userId: session.userId,
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    // Fetch all knowledge base data
    const [eventDefinitions, businessMetrics, knowledgeEntries] = await Promise.all([
      prisma.eventDefinition.findMany({
        where: { userId: session.userId, isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.businessMetric.findMany({
        where: { userId: session.userId, isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.knowledgeEntry.findMany({
        where: { userId: session.userId, isActive: true },
        orderBy: { title: 'asc' }
      })
    ]);

    // If there's a search query, filter results
    let filteredEventDefinitions = eventDefinitions;
    let filteredBusinessMetrics = businessMetrics;
    let filteredKnowledgeEntries = knowledgeEntries;

    if (query) {
      const searchTerm = query.toLowerCase();
      
      filteredEventDefinitions = eventDefinitions.filter(ed => 
        ed.name.toLowerCase().includes(searchTerm) ||
        ed.description.toLowerCase().includes(searchTerm) ||
        ed.category.toLowerCase().includes(searchTerm)
      );

      filteredBusinessMetrics = businessMetrics.filter(bm => 
        bm.name.toLowerCase().includes(searchTerm) ||
        bm.description.toLowerCase().includes(searchTerm) ||
        bm.category.toLowerCase().includes(searchTerm) ||
        bm.formula.toLowerCase().includes(searchTerm)
      );

      filteredKnowledgeEntries = knowledgeEntries.filter(ke => 
        ke.title.toLowerCase().includes(searchTerm) ||
        ke.content.toLowerCase().includes(searchTerm) ||
        ke.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return NextResponse.json({
      eventDefinitions: filteredEventDefinitions,
      businessMetrics: filteredBusinessMetrics,
      knowledgeEntries: filteredKnowledgeEntries,
      summary: {
        totalEvents: filteredEventDefinitions.length,
        totalMetrics: filteredBusinessMetrics.length,
        totalEntries: filteredKnowledgeEntries.length
      }
    });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 