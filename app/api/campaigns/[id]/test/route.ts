import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { pushNotificationService } from '../../../../../lib/push-notifications';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;

    // Get the campaign
    const campaign = await prisma.notificationCampaign.findFirst({
      where: {
        id: campaignId,
        userId: session.userId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user has push subscription
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.userId,
        isActive: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({ 
        error: 'No active push subscription found. Please subscribe to push notifications first.' 
      }, { status: 400 });
    }

    // Prepare notification payload using campaign data
    const notificationPayload = {
      title: campaign.name,
      body: campaign.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `campaign-test-${campaignId}`,
      data: {
        campaignId: campaignId,
        offerCode: campaign.offerCode,
        url: '/campaigns',
        test: true,
      },
    };

    // Send test notification to current user only
    const sendResult = await pushNotificationService.sendNotificationToUsers(
      [session.userId],
      notificationPayload,
      campaignId // Include campaignId for tracking
    );

    if (!sendResult.success) {
      return NextResponse.json({ 
        error: 'Failed to send test notification',
        details: sendResult.errors 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        message: campaign.message,
      },
      deliverySummary: {
        sentCount: sendResult.sentCount,
        failedCount: sendResult.failedCount,
      },
    });

  } catch (error) {
    console.error('Error testing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 