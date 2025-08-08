import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SMSService } from '../../../lib/sms/service';

const smsService = new SMSService();

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = orgId || userId;
    const templates = await smsService.getTemplates(organizationId);
    
    return NextResponse.json({
      templates,
    });
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS templates' },
      { status: 500 }
    );
  }
} 