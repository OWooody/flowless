import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PersonalizationEngine } from '../../../lib/personalization/engine';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Creating behavioral triggers...');
    
    const { userId, orgId } = await auth();
    console.log('🔍 Auth result:', { userId, orgId });
    
    if (!userId) {
      console.log('🔍 Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = orgId || userId;
    console.log('🔍 Organization ID:', organizationId);

    const engine = new PersonalizationEngine();
    console.log('🔍 Engine created, creating triggers...');
    
    await engine.createBehavioralTriggers(organizationId);
    console.log('🔍 Triggers created successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Default behavioral triggers created successfully' 
    });
  } catch (error) {
    console.error('🔍 Error creating behavioral triggers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create behavioral triggers' },
      { status: 500 }
    );
  }
} 