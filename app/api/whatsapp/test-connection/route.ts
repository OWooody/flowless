import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { whatsappService } from '../../../lib/whatsapp/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the current provider
    const provider = await whatsappService.getProvider(orgId);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'No WhatsApp provider configured' },
        { status: 404 }
      );
    }

    // Test the connection by trying to send a test message
    // This will validate the provider configuration
    try {
      // Create a test message object
      const credentials = provider.credentials as any;
      const testMessage = {
        from: credentials?.fromPhone || '+1234567890', // Use provider's from phone or dummy
        to: '+1234567890', // Dummy number for testing
        templateName: 'test_template',
        language: 'en',
        variables: {}
      };

      // Try to send the message (this will test the connection)
      const result = await whatsappService.sendMessage(orgId, testMessage);
      
      // If we get here, the connection is working
      return NextResponse.json({
        success: true,
        message: 'Connection test successful',
        provider: {
          name: provider.providerName,
          displayName: provider.displayName,
          isActive: provider.isActive
        }
      });
    } catch (connectionError) {
      // Connection failed
      return NextResponse.json(
        { 
          success: false,
          error: 'Connection test failed. Please check your credentials.' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error testing WhatsApp connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 