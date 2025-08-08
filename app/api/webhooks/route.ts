import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '../../lib/prisma';
import crypto from 'crypto';

// Generate a random secret for webhook signing
function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching webhooks for org:', orgId);

    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId: orgId || undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found webhooks:', webhooks.length);

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to fetch webhooks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, events, eventName, filterItemName, filterItemCategory, filterItemId, filterValue } = body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid webhook configuration' },
        { status: 400 }
      );
    }

    console.log('Creating webhook for org:', orgId);

    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        eventName,
        filterItemName,
        filterItemCategory,
        filterItemId,
        filterValue,
        secret: generateWebhookSecret(),
        organizationId: orgId || undefined,
      },
    });

    console.log('Created webhook:', webhook.id);

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to create webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 