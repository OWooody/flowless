import { NextRequest, NextResponse } from 'next/server';
import { slackService } from '@/lib/integrations/slack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialId, channel, message } = body;

    if (!credentialId || !channel || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: credentialId, channel, message' },
        { status: 400 }
      );
    }

    const result = await slackService.sendMessage(credentialId, {
      channel,
      text: message,
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      result,
    });
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      },
      { status: 500 }
    );
  }
}
