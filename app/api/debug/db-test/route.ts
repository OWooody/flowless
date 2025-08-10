import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { credentialService } from '@/lib/credentials';

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test result:', dbTest);

    // Test if the IntegrationCredential table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'IntegrationCredential'
      ) as exists
    `;
    console.log('Table existence check:', tableExists);

    // Test if we can query the table
    let tableQueryTest;
    try {
      tableQueryTest = await prisma.integrationCredential.findMany({ take: 1 });
      console.log('Table query test successful, found records:', tableQueryTest.length);
    } catch (error) {
      console.error('Table query test failed:', error);
      tableQueryTest = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check environment variables
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY ? 'Set' : 'Not set (using default)',
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    };

    return NextResponse.json({
      success: true,
      database: {
        connection: 'OK',
        tableExists: tableExists[0]?.exists || false,
        tableQuery: tableQueryTest.error ? 'Failed' : 'OK'
      },
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testCredential } = body;

    if (!testCredential) {
      return NextResponse.json({ error: 'testCredential parameter required' }, { status: 400 });
    }

    // Test credential creation
    const result = await credentialService.createCredential({
      userId: 'test-user-' + Date.now(),
      provider: 'test',
      name: 'Test Credential',
      config: { test: true, timestamp: new Date().toISOString() }
    });

    // Clean up test credential
    await prisma.integrationCredential.delete({
      where: { id: result.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Test credential created and cleaned up successfully',
      credentialId: result.id
    });

  } catch (error) {
    console.error('Test credential creation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
