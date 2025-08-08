import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unique event names from the database
    const events = await prisma.event.findMany({
      select: {
        name: true,
      },
      distinct: ['name'],
      orderBy: {
        name: 'asc',
      },
    });

    const eventNames = events.map(event => event.name);
    console.log('Found event names:', eventNames); // Add logging

    return NextResponse.json({ eventNames });
  } catch (error) {
    console.error('Error fetching event names:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event names' },
      { status: 500 }
    );
  }
} 