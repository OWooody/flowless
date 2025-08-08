import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SMSService } from '../../../../../lib/sms/service';

const smsService = new SMSService();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = orgId || userId;
    const providerId = params.id;

    // Get the provider instance and sync templates
    const provider = await smsService.getProvider(organizationId);
    
    if (!provider || provider.id !== providerId) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Sync templates
    const templates = await smsService.syncTemplates(organizationId);

    return NextResponse.json({
      success: true,
      templates,
      message: `Synced ${templates.length} templates`
    });
  } catch (error: any) {
    console.error('Error syncing SMS templates:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to sync templates' 
      },
      { status: 500 }
    );
  }
} 