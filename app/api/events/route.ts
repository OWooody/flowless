import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as UAParser from 'ua-parser-js';
import prisma from '../../lib/prisma';
import { triggerWebhooks } from '../../lib/webhook';
import { captureRequestManually } from '../../lib/debug-interceptor';

// Helper function to get client IP
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { userId: authUserId, orgId } = getAuth(req);
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = getClientIp(req);
    const parser = new UAParser.UAParser(userAgent);
    const userAgentInfo = parser.getResult();
    const referrerHeader = req.headers.get('referer') || '';

    const body = await req.json();
    const {
      name,
      properties,
      timestamp,
      category,
      path,
      pageTitle,
      action,
      itemName,
      itemId,
      itemCategory,
      value: rawValue,
      planId,
      userId,
      userPhone,
    } = body;
    
    // Handle value field - convert string numbers to actual numbers
    let value: number | null = null;
    if (rawValue !== null && rawValue !== undefined) {
      if (typeof rawValue === 'string') {
        const parsedValue = parseFloat(rawValue);
        value = isNaN(parsedValue) ? null : parsedValue;
      } else if (typeof rawValue === 'number') {
        value = rawValue;
      }
    }
    
    // Fallback logic: if standard attributes are not provided, try to get them from properties
    let finalItemId = itemId;
    let finalValue = value;
    let finalItemName = itemName;
    let finalItemCategory = itemCategory;
    
    if (properties && typeof properties === 'object') {
      // Only populate if the standard attributes are not already provided
      if (!finalItemId && properties.id) {
        finalItemId = String(properties.id);
      }
      if (!finalValue && properties.value !== null && properties.value !== undefined) {
        if (typeof properties.value === 'string') {
          const parsedValue = parseFloat(properties.value);
          finalValue = isNaN(parsedValue) ? null : parsedValue;
        } else if (typeof properties.value === 'number') {
          finalValue = properties.value;
        }
      }
      if (!finalItemName && properties.name) {
        finalItemName = String(properties.name);
      }
      if (!finalItemCategory && properties.category) {
        finalItemCategory = String(properties.category);
      }
    }
    
    // Capture request for debug (after body is read)
    // Use the userId from the request body, not the authenticated user
    captureRequestManually(req, body, userId);

    // Create event with only the fields defined in the schema
    const eventData = {
      name,
      properties,
      timestamp: new Date(timestamp),
      pageTitle,
      action,
      itemName: finalItemName,
      itemId: finalItemId,
      itemCategory: finalItemCategory,
      value: finalValue,
      ipAddress,
      userAgent: userAgentInfo.browser.name,
      referrer: referrerHeader,
      category: category || 'engagement',
      planId,
      userId: userId ? String(userId) : null,
      userPhone,
      organizationId: orgId || '',
    };

    const event = await prisma.event.create({
      data: eventData
    });

    // Trigger webhooks for event creation
    await triggerWebhooks('event.created', event);

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: authUserId } = getAuth(req);
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capture request for debug (no body for GET requests)
    captureRequestManually(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EventWhereInput = {
      ...(name && { name: { contains: name, mode: Prisma.QueryMode.insensitive } }),
      ...(category && { category: { contains: category, mode: Prisma.QueryMode.insensitive } }),
      ...(searchParams.get('planId') && { planId: searchParams.get('planId') }),
      ...(startDate || endDate ? {
        timestamp: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    // Get events
    const events = await prisma.event.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: limit,
    });

    console.log('Found events:', events.length);

    return NextResponse.json({
      events,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
} 