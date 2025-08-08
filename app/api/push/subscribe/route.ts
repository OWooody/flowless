import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint, p256dh, auth: authKey } = await request.json();

    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ 
        error: 'Missing required subscription parameters' 
      }, { status: 400 });
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existingSubscription) {
      // Update existing subscription
      const updatedSubscription = await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          p256dh,
          auth: authKey,
          isActive: true,
          userId: session.userId,
          organizationId: session.orgId || null,
        },
      });

      return NextResponse.json({
        success: true,
        subscription: updatedSubscription,
        message: 'Push subscription updated successfully',
      });
    } else {
      // Create new subscription
      const newSubscription = await prisma.pushSubscription.create({
        data: {
          endpoint,
          p256dh,
          auth: authKey,
          userId: session.userId,
          organizationId: session.orgId || null,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        subscription: newSubscription,
        message: 'Push subscription created successfully',
      });
    }

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ 
        error: 'Missing endpoint parameter' 
      }, { status: 400 });
    }

    // Deactivate subscription
    await prisma.pushSubscription.updateMany({
      where: {
        endpoint,
        userId: session.userId,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription deactivated successfully',
    });

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    );
  }
} 