import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SMSService } from '../../../lib/sms/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = orgId || userId;
    const body = await request.json();
    
    const { fromPhone, toPhone, message, templateName, variables } = body;

    // Validate required fields
    if (!toPhone) {
      return NextResponse.json({ 
        error: 'To phone is required' 
      }, { status: 400 });
    }

    if (!message && !templateName) {
      return NextResponse.json({ 
        error: 'Either message or template name is required' 
      }, { status: 400 });
    }

    // Validate phone number format for toPhone
    if (!toPhone.startsWith('+')) {
      return NextResponse.json({ 
        error: 'To phone number must be in international format (e.g., +1234567890)' 
      }, { status: 400 });
    }

    const smsService = new SMSService();

    // Prepare message object
    const messageData = {
      from: fromPhone || undefined, // Make from optional
      to: toPhone,
      message: message || undefined,
      templateName: templateName || undefined,
      variables: variables || {},
    };

    console.log('📱 Sending SMS test message:', messageData);

    // Send the message
    const result = await smsService.sendMessage(organizationId, messageData);

    console.log('📱 SMS test result:', result);

    // Check if the SMS was actually successful
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully',
        result,
        requestDetails: {
          apiEndpoint: 'https://el.cloud.unifonic.com/rest/SMS/messages',
          formData: {
            AppSid: '***', // API key hidden for security
            Recipient: messageData.to?.replace(/^\+/, '') || '',
            Body: messageData.message || '',
            SenderID: messageData.from || 'Unifonic',
          },
          organizationId,
          provider: 'unifonic'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || 'Failed to send test message',
        result,
        requestDetails: {
          apiEndpoint: 'https://el.cloud.unifonic.com/rest/SMS/messages',
          formData: {
            AppSid: '[HIDDEN]',
            Recipient: messageData.to?.replace(/^\+/, '') || '',
            Body: messageData.message || '',
            SenderID: messageData.from || 'Unifonic',
          },
          organizationId,
          provider: 'unifonic'
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error sending SMS test message:', error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send test message',
      details: error
    }, { status: 500 });
  }
} 