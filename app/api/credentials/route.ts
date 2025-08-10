import { NextRequest, NextResponse } from 'next/server';
import { credentialService } from '@/lib/credentials';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection test successful');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your database configuration.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const provider = searchParams.get('provider');
    const organizationId = searchParams.get('organizationId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    let credentials;
    if (provider) {
      credentials = await credentialService.getCredentialsByProvider(
        userId,
        provider,
        organizationId || undefined
      );
    } else {
      credentials = await credentialService.getCredentialsByUser(
        userId,
        organizationId || undefined
      );
    }

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection test successful');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your database configuration.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, organizationId, provider, name, config } = body;

    console.log('Received credential creation request:', { 
      userId, 
      organizationId, 
      provider, 
      name, 
      hasConfig: !!config,
      configKeys: config ? Object.keys(config) : []
    });

    if (!userId || !provider || !name || !config) {
      const missingFields = [];
      if (!userId) missingFields.push('userId');
      if (!provider) missingFields.push('provider');
      if (!name) missingFields.push('name');
      if (!config) missingFields.push('config');
      
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate config object
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      console.error('Invalid config format:', typeof config);
      return NextResponse.json(
        { error: 'Config must be a valid object' },
        { status: 400 }
      );
    }

    console.log('Creating credential with validated data');
    const credential = await credentialService.createCredential({
      userId,
      organizationId,
      provider,
      name,
      config,
    });

    console.log('Credential created successfully:', credential.id);
    return NextResponse.json({ credential }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating credential:', error);
    
    let errorMessage = 'Failed to create credential';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Missing required fields')) {
        statusCode = 400;
      } else if (error.message.includes('Config must be a valid object')) {
        statusCode = 400;
      } else if (error.message.includes('database') || error.message.includes('connection')) {
        statusCode = 503; // Service Unavailable
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
