import { NextRequest, NextResponse } from 'next/server';
import { slackService } from '@/lib/integrations/slack';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId is required' },
        { status: 400 }
      );
    }

    const authTest = await slackService.testAuth(credentialId);

    return NextResponse.json({
      success: true,
      authTest,
    });
  } catch (error) {
    console.error('Error testing Slack auth:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test auth' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialId, channel, message } = body;

    console.log('🚀 POST /api/test-slack called with:', {
      credentialId,
      channel,
      message,
      timestamp: new Date().toISOString()
    });

    if (!credentialId || !channel || !message) {
      console.error('❌ Missing required fields:', { credentialId, channel, message });
      return NextResponse.json(
        { error: 'Missing required fields: credentialId, channel, message' },
        { status: 400 }
      );
    }

    console.log('📤 Attempting to send Slack message via slackService...');

    const result = await slackService.sendMessage(credentialId, {
      channel,
      text: message,
    });

    console.log('✅ Slack message sent successfully:', {
      result,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      result,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}`
    });
  } catch (error) {
    console.error('💥 Error sending Slack message:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
