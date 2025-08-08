import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { whatsappService } from '../../../lib/whatsapp/service';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get available providers
    const availableProviders = whatsappService.getAvailableProviders();
    
    // Get current provider for organization
    const currentProvider = await whatsappService.getProvider(orgId);

    return NextResponse.json({
      availableProviders,
      currentProvider,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp providers' },
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

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { providerName, displayName, credentials, config, webhookUrl, webhookSecret } = body;

    if (!providerName || !displayName || !credentials) {
      return NextResponse.json(
        { error: 'Provider name, display name, and credentials are required' },
        { status: 400 }
      );
    }

    const provider = await whatsappService.createProvider(orgId, {
      providerName,
      displayName,
      credentials,
      config,
      webhookUrl,
      webhookSecret,
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error creating WhatsApp provider:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create WhatsApp provider' },
      { status: 500 }
    );
  }
} 