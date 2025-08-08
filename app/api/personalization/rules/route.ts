import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PersonalizationEngine } from '../../../lib/personalization/engine';
import prisma from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = orgId || userId;

    const engine = new PersonalizationEngine();
    await engine.loadRules(organizationId);

    // Get rules from database using raw query for now
    const rules = await prisma.$queryRaw`
      SELECT * FROM "PersonalizationRule" 
      WHERE "organizationId" = ${organizationId} 
      AND "isActive" = true 
      ORDER BY "priority" DESC
    ` as any[];

    console.log('🔍 Found rules:', rules.length);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching personalization rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personalization rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = orgId || userId;

    const body = await request.json();
    const { name, description, conditions, content, priority = 0 } = body;

    if (!name || !conditions || !content) {
      return NextResponse.json(
        { error: 'Name, conditions, and content are required' },
        { status: 400 }
      );
    }

    const engine = new PersonalizationEngine();
    
    // Create the rule in database
    const rule = await engine.createRule({
      name,
      description,
      conditions,
      content,
      priority,
      organizationId
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating personalization rule:', error);
    return NextResponse.json(
      { error: 'Failed to create personalization rule' },
      { status: 500 }
    );
  }
} 