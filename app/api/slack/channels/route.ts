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

    const channels = await slackService.getChannels(credentialId);

    return NextResponse.json({
      success: true,
      channels: channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        purpose: channel.purpose?.value || null,
        is_private: channel.is_private,
        is_archived: channel.is_archived,
        num_members: channel.num_members
      }))
    });
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch channels' 
      },
      { status: 500 }
    );
  }
}
