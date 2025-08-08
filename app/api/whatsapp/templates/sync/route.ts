import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { whatsappService } from '../../../../lib/whatsapp/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const templates = await whatsappService.syncTemplates(orgId);

    return NextResponse.json({
      success: true,
      templates,
      message: `Successfully synced ${templates.length} templates`,
    });
  } catch (error) {
    console.error('Error syncing WhatsApp templates:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to sync WhatsApp templates' },
      { status: 500 }
    );
  }
} 