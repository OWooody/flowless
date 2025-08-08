import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { whatsappService } from '../../../lib/whatsapp/service';
import { WhatsAppMessage } from '../../../lib/whatsapp/providers/base';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 WhatsApp test API called');
    
    const { userId, orgId } = await auth();
    console.log(`👤 User: ${userId}, Org: ${orgId}`);
    
    if (!userId || !orgId) {
      console.log('❌ Unauthorized: Missing user or org ID');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromPhone, toPhone, templateName, namespace, variables, language } = body;
    
    console.log('📨 Request body:', {
      fromPhone,
      toPhone,
      templateName,
      namespace,
      variables,
      language
    });

    // Validate required fields
    if (!fromPhone || !toPhone || !templateName || !namespace) {
      console.log('❌ Missing required fields:', { fromPhone, toPhone, templateName, namespace });
      return NextResponse.json(
        { error: 'From phone, to phone, template name, and namespace are required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!fromPhone.startsWith('+') || !toPhone.startsWith('+')) {
      console.log('❌ Invalid phone format:', { fromPhone, toPhone });
      return NextResponse.json(
        { error: 'Phone numbers must be in international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Get the current provider
    console.log('🔍 Getting WhatsApp provider...');
    const provider = await whatsappService.getProvider(orgId);
    
    if (!provider) {
      console.log('❌ No WhatsApp provider configured');
      return NextResponse.json(
        { error: 'No WhatsApp provider configured' },
        { status: 404 }
      );
    }
    
    console.log('✅ Provider found:', provider.providerName);

    // Create message object
    const message: WhatsAppMessage = {
      from: fromPhone,
      to: toPhone,
      templateName: templateName,
      namespace: namespace,
      language: language || 'ar',
      variables: variables || {}
    };
    
    console.log('📤 Sending message:', message);

    // Send the message
    const result = await whatsappService.sendMessage(orgId, message);
    console.log('📥 Send result:', result);

    if (result.success) {
      console.log('✅ Message sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully',
        messageId: result.messageId,
        status: result.status,
        provider: {
          name: provider.providerName,
          displayName: provider.displayName
        }
      });
    } else {
      console.log('❌ Message send failed:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send test message'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error sending test WhatsApp message:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 