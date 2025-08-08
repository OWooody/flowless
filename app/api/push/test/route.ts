import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { pushNotificationService } from '../../../../lib/push-notifications';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ 
        error: 'Title and body are required' 
      }, { status: 400 });
    }

    // Get the current user's push subscription
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.userId,
        isActive: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({ 
        error: 'No active push subscription found for this user' 
      }, { status: 400 });
    }

    // Send test notification
    const notificationPayload = {
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification',
      data: {
        url: '/campaigns',
        test: true,
      },
    };

    const result = await pushNotificationService.sendNotificationToUsers(
      [session.userId],
      notificationPayload
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to send test notification',
        details: result.errors 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      sentCount: result.sentCount,
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 