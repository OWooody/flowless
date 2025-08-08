import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get('segmentId');

    const where: any = {
      userId: session.userId,
    };

    if (segmentId) {
      where.segmentId = segmentId;
    }

    const campaigns = await prisma.notificationCampaign.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        message: true,
        status: true,
        targetSegment: true,
        estimatedUsers: true,
        sentCount: true,
        createdAt: true,
        scheduledAt: true,
      },
    });

    return NextResponse.json({
      campaigns,
      summary: {
        total: campaigns.length,
        draft: campaigns.filter(c => c.status === 'draft').length,
        scheduled: campaigns.filter(c => c.status === 'scheduled').length,
        sent: campaigns.filter(c => c.status === 'sent').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, message, targetSegment, segmentId, estimatedUsers, offerCode, scheduledAt } = body;

    if (!name || !message || !targetSegment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await prisma.notificationCampaign.create({
      data: {
        name,
        message,
        targetSegment,
        segmentId: segmentId || null,
        estimatedUsers: estimatedUsers || 0,
        offerCode: offerCode || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'draft',
        userId: session.userId,
        organizationId: session.orgId || null,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 