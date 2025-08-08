import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PersonalizationEngine } from '../../../lib/personalization/engine';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = orgId || userId;

    const body = await request.json();
    const { testUserId, testContext } = body;

    const engine = new PersonalizationEngine();
    await engine.loadRules(organizationId);

    // Test with sample user data
    const personalizedContent = await engine.evaluateUser(testUserId || 'test-user-123', {
      context: {
        currentPage: '/products',
        referrer: 'google',
        timeOfDay: 'afternoon',
        device: 'mobile'
      },
      session: {
        sessionId: 'test-session-123',
        startTime: new Date(),
        pageViews: ['/home', '/products', '/cart'],
        interactions: []
      }
    });

    return NextResponse.json({
      success: true,
      personalizedContent,
      testUserId: testUserId || 'test-user-123',
      testContext: {
        currentPage: '/products',
        referrer: 'google',
        timeOfDay: 'afternoon',
        device: 'mobile'
      }
    });
  } catch (error) {
    console.error('Error testing personalization:', error);
    return NextResponse.json(
      { error: 'Failed to test personalization' },
      { status: 500 }
    );
  }
} 