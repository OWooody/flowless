import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking all personalization rules...');
    
    // Get all rules from database
    const allRules = await prisma.$queryRaw`
      SELECT * FROM "PersonalizationRule" 
      ORDER BY "priority" DESC
    ` as any[];

    console.log('🔍 Debug: Found', allRules.length, 'rules total');
    console.log('🔍 Debug: Rules:', allRules.map(r => ({ id: r.id, name: r.name, organizationId: r.organizationId })));

    return NextResponse.json({ 
      totalRules: allRules.length,
      rules: allRules.map(r => ({
        id: r.id,
        name: r.name,
        organizationId: r.organizationId,
        isActive: r.isActive,
        priority: r.priority
      }))
    });
  } catch (error) {
    console.error('🔍 Debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to debug rules' },
      { status: 500 }
    );
  }
} 