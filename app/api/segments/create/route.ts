import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import the executeSafeQuery function from the analytics chat route
const DANGEROUS_KEYWORDS = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 'TRUNCATE'];
const MAX_RESULTS = 10000;
const QUERY_TIMEOUT = 30000; // 30 seconds

function isQuerySafe(sql: string): boolean {
  const upperSql = sql.toUpperCase();
  
  // Check for dangerous keywords
  if (DANGEROUS_KEYWORDS.some(keyword => upperSql.includes(keyword))) {
    return false;
  }
  
  // Must start with SELECT or WITH (for CTEs)
  const trimmedSql = upperSql.trim();
  if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
    return false;
  }
  
  // If it starts with WITH, it must contain SELECT later
  if (trimmedSql.startsWith('WITH') && !trimmedSql.includes('SELECT')) {
    return false;
  }
  
  // No multiple statements
  if (upperSql.includes(';') && upperSql.split(';').length > 2) {
    return false;
  }
  
  return true;
}

async function executeSafeQuery(sql: string, timeoutMs: number = QUERY_TIMEOUT, userId?: string) {
  if (!isQuerySafe(sql)) {
    throw new Error('Query not allowed for security reasons');
  }
  
  // Add LIMIT if not present
  if (!sql.toUpperCase().includes('LIMIT')) {
    sql += ` LIMIT ${MAX_RESULTS}`;
  }

  try {
    const results = await prisma.$queryRawUnsafe(sql);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, query } = await request.json();
    
    if (!name || !query) {
      return NextResponse.json({ error: 'Name and query are required' }, { status: 400 });
    }

    // Validate that query is a SQL query
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query must be a valid SQL query string' }, { status: 400 });
    }

    const criteria = query.trim();
    
    // Basic SQL validation
    if (!criteria.toUpperCase().startsWith('SELECT')) {
      return NextResponse.json({ error: 'Query must be a valid SELECT query' }, { status: 400 });
    }

    // Check if it's trying to select userId
    if (!criteria.toUpperCase().includes('USERID')) {
      return NextResponse.json({ error: 'Query must select userId from the Event table' }, { status: 400 });
    }

    // Execute the query to get the actual user count
    let actualUserCount = 0;
    try {
      const results = await executeSafeQuery(criteria, QUERY_TIMEOUT, session.userId);
      actualUserCount = results.length;
    } catch (error) {
      console.error('Error executing segment query for user count:', error);
      // If query fails, use 0 as count
      actualUserCount = 0;
    }

    const segment = await prisma.userSegment.create({
      data: {
        name: name,
        description: description || null,
        query: criteria,
        userCount: actualUserCount,
        criteria: { criteria: criteria },
        createdFromAiChat: false, // Manual creation
        userId: session.userId,
        organizationId: session.orgId || null
      } as any
    });

    return NextResponse.json({ 
      segment,
      message: 'Segment created successfully'
    });

  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create segment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 