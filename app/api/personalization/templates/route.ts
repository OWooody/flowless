import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = orgId || userId;

    // Get templates from database
    const templates = await prisma.$queryRaw`
      SELECT * FROM "PersonalizationTemplate" 
      WHERE "organizationId" = ${organizationId} 
      ORDER BY "createdAt" DESC
    ` as any[];

    console.log('🔍 Found templates:', templates.length);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching personalization templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personalization templates' },
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
    const { name, type, content, variables = [] } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    // Create template in database
    const template = await prisma.$executeRaw`
      INSERT INTO "PersonalizationTemplate" (
        "id", "name", "type", "content", "variables", "organizationId", "createdAt", "updatedAt"
      ) VALUES (
        ${`template_${Date.now()}`}, 
        ${name}, 
        ${type}, 
        ${content}, 
        ${JSON.stringify(variables)}, 
        ${organizationId}, 
        NOW(), 
        NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Template created successfully' 
    });
  } catch (error) {
    console.error('Error creating personalization template:', error);
    return NextResponse.json(
      { error: 'Failed to create personalization template' },
      { status: 500 }
    );
  }
} 