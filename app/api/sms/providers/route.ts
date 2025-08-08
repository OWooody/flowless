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
    const provider = await smsService.getProvider(organizationId);
    
    return NextResponse.json({
      providers: provider ? [provider] : [],
    });
  } catch (error) {
    console.error('Error fetching SMS providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = orgId || userId;
    const body = await request.json();

    const provider = await smsService.createProvider(organizationId, {
      providerName: body.providerName,
      displayName: body.displayName,
      credentials: body.credentials,
      config: body.config,
      webhookUrl: body.webhookUrl,
      webhookSecret: body.webhookSecret,
    });

    return NextResponse.json({ provider });
  } catch (error: any) {
    console.error('Error creating SMS provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create SMS provider' },
      { status: 500 }
    );
  }
} 