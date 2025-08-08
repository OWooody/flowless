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

    // Get the provider instance and test connection
    const provider = await smsService.getProvider(organizationId);
    
    if (!provider || provider.id !== providerId) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Test the connection
    const isConnected = await smsService.testConnection(organizationId);

    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error: any) {
    console.error('Error testing SMS provider connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to test connection' 
      },
      { status: 500 }
    );
  }
} 