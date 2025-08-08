import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    const token = await auth.getToken({ template: 'supabase' });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to generate JWT', details: 'No token generated. Please ensure you are signed in.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating JWT:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate JWT', 
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Please ensure you are signed in.'
      },
      { status: 500 }
    );
  }
} 