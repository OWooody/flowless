import { NextRequest, NextResponse } from 'next/server';
import { credentialService } from '@/lib/credentials';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await credentialService.testCredential(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing credential:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 400 }
    );
  }
}
