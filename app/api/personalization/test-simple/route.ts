import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationEngine } from '../../../lib/personalization/engine';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing personalization engine...');
    
    const engine = new PersonalizationEngine();
    
    // Test creating triggers for a test organization
    const testOrgId = 'test-org-123';
    console.log('🔍 Creating test triggers for org:', testOrgId);
    
    await engine.createBehavioralTriggers(testOrgId);
    console.log('🔍 Test triggers created successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Test behavioral triggers created successfully',
      organizationId: testOrgId
    });
  } catch (error) {
    console.error('🔍 Error in test:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test personalization' },
      { status: 500 }
    );
  }
} 