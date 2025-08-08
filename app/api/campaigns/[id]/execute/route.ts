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

    // Check if campaign can be executed
    if (campaign.status === 'sent' || campaign.status === 'completed') {
      return NextResponse.json({ 
        error: 'Campaign has already been sent' 
      }, { status: 400 });
    }

    // Get the target users from the segment
    let targetUsers: string[] = [];
    if (campaign.segmentId) {
      try {
        // Execute the segment query to get user IDs
        const segment = await prisma.userSegment.findFirst({
          where: {
            id: campaign.segmentId,
            userId: session.userId,
          },
        });

        if (segment) {
          // Execute the segment query to get actual user IDs
          const results = await prisma.$queryRawUnsafe(segment.query);
          targetUsers = (results as any[]).map((row: any) => row.userId);
        }
      } catch (error) {
        console.error('Error executing segment query:', error);
        return NextResponse.json({ 
          error: 'Failed to execute segment query' 
        }, { status: 500 });
      }
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ 
        error: 'No users found in the target segment' 
      }, { status: 400 });
    }

    // Prepare notification payload
    const notificationPayload = {
      title: campaign.name,
      body: campaign.message,
      icon: '/favicon.ico', // Default icon
      badge: '/favicon.ico',
      tag: `campaign-${campaignId}`,
      data: {
        campaignId: campaignId,
        offerCode: campaign.offerCode,
        url: '/campaigns', // Default click URL
      },
    };

    // Send push notifications
    const sendResult = await pushNotificationService.sendNotificationToUsers(
      targetUsers,
      notificationPayload,
      campaignId
    );

    if (!sendResult.success) {
      return NextResponse.json({ 
        error: 'Failed to send notifications',
        details: sendResult.errors 
      }, { status: 500 });
    }

    // Update campaign status and metrics
    const updatedCampaign = await prisma.notificationCampaign.update({
      where: {
        id: campaignId,
      },
      data: {
        status: 'sent',
        sentCount: sendResult.sentCount,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      deliverySummary: {
        totalUsers: targetUsers.length,
        sentCount: sendResult.sentCount,
        failedCount: sendResult.failedCount,
        errors: sendResult.errors,
      },
    });

  } catch (error) {
    console.error('Error executing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to execute campaign' },
      { status: 500 }
    );
  }
} 