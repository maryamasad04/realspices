import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { verifyAuthHeader } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user profile from local PostgreSQL database
    console.log('[User Auth] Fetching profile for user:', decoded.id);
    const { data: users, error } = await postgres
      .from('users')
      .select('id, email, name, phone, created_at')
      .eq('id', decoded.id);

    if (error) {
      console.error('[User Auth] PostgreSQL database error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: users[0]
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
