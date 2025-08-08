import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify campaign exists and belongs to user
    const campaign = await prisma.notificationCampaign.findFirst({
      where: {
        id: params.id,
        userId: session.userId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // For now, return mock analytics data
    // In a real implementation, this would query actual delivery/engagement data
    const mockAnalytics = {
      totalSent: campaign.sentCount || 0,
      totalDelivered: Math.floor((campaign.sentCount || 0) * 0.95), // 95% delivery rate
      totalOpened: Math.floor((campaign.sentCount || 0) * 0.25), // 25% open rate
      totalClicked: Math.floor((campaign.sentCount || 0) * 0.08), // 8% click rate
      openRate: 25.0,
      clickRate: 8.0,
      conversionRate: 2.5, // 2.5% conversion rate
    };

    return NextResponse.json({ analytics: mockAnalytics });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 