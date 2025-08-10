import { NextRequest, NextResponse } from 'next/server';
import { credentialService } from '@/lib/credentials';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const credential = await credentialService.getCredential(params.id);
    
    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    return NextResponse.json({ credential });
  } catch (error) {
    console.error('Error fetching credential:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credential' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, config, isActive } = body;

    const credential = await credentialService.updateCredential(params.id, {
      name,
      config,
      isActive,
    });

    return NextResponse.json({ credential });
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const credential = await credentialService.deleteCredential(params.id);
    return NextResponse.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}
