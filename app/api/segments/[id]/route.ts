import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import the executeSafeQuery function from the analytics chat route
// Since we can't directly import it, we'll recreate the necessary parts
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segmentId = params.id;

    // Check if segment exists and belongs to the user
    const segment = await prisma.userSegment.findFirst({
      where: {
        id: segmentId,
        userId: session.userId,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Delete the segment
    await prisma.userSegment.delete({
      where: {
        id: segmentId,
      },
    });

    return NextResponse.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segmentId = params.id;

    const segment = await prisma.userSegment.findFirst({
      where: {
        id: segmentId,
        userId: session.userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        query: true,
        userCount: true,
        criteria: true,
        isActive: true,
        createdFromAiChat: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json({ segment });
  } catch (error) {
    console.error('Error fetching segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segmentId = params.id;
    const body = await request.json();
    const { action } = body;

    if (action === 'refresh_user_count') {
      // Get the segment
      const segment = await prisma.userSegment.findFirst({
        where: {
          id: segmentId,
          userId: session.userId,
        },
      });

      if (!segment) {
        return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
      }

      // Execute the query to get updated user count
      let actualUserCount = segment.userCount || 0; // Start with existing count as fallback
      try {
        console.log('Executing segment query:', segment.query); // Debug log
        const results = await executeSafeQuery(segment.query, 30000, session.userId);
        console.log('Raw query results:', results); // Debug log
        actualUserCount = results.length;
        console.log('Query results count:', actualUserCount); // Debug log
      } catch (error) {
        console.error('Error executing segment query for user count:', error);
        // Don't fail the request, just keep the existing count
        console.log('Keeping existing user count:', actualUserCount);
      }

      // Update the segment with new user count
      const updatedSegment = await prisma.userSegment.update({
        where: { id: segmentId },
        data: { 
          userCount: actualUserCount,
          updatedAt: new Date()
        },
      });

      return NextResponse.json({ 
        segment: updatedSegment,
        message: `User count updated to ${actualUserCount}`
      });
    }

    if (action === 'update_query') {
      const { query } = body;
      
      if (!query || typeof query !== 'string') {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      // Get the segment
      const segment = await prisma.userSegment.findFirst({
        where: {
          id: segmentId,
          userId: session.userId,
        },
      });

      if (!segment) {
        return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
      }

      // Validate the new query
      const trimmedQuery = query.trim();
      
      // Basic SQL validation
      if (!trimmedQuery.toUpperCase().startsWith('SELECT')) {
        return NextResponse.json({ error: 'Query must be a valid SELECT query' }, { status: 400 });
      }

      // Check if it's trying to select userId
      if (!trimmedQuery.toUpperCase().includes('USERID')) {
        return NextResponse.json({ error: 'Query must select userId from the Event table' }, { status: 400 });
      }

      // Test the query by executing it
      let actualUserCount = 0;
      try {
        const results = await executeSafeQuery(trimmedQuery, 30000, session.userId);
        actualUserCount = results.length;
      } catch (error) {
        console.error('Error testing updated query:', error);
        return NextResponse.json({ 
          error: `Query validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 400 });
      }

      // Update the segment with new query and user count
      const updatedSegment = await prisma.userSegment.update({
        where: { id: segmentId },
        data: { 
          query: trimmedQuery,
          userCount: actualUserCount,
          criteria: { criteria: trimmedQuery },
          updatedAt: new Date()
        },
      });

      return NextResponse.json({ 
        segment: updatedSegment,
        message: `Query updated successfully. User count: ${actualUserCount}`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 