import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { signToken } from '@/lib/jwt';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[User Auth] === LOGIN ATTEMPT ===');
    console.log('[User Auth] Request body keys:', Object.keys(body));

    // Validate required fields
    if (!email?.trim() || !password?.trim()) {
      console.log('[User Auth] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email in local PostgreSQL database
    console.log(`[User Auth] Login attempt for email: ${email}`);
    const { data: users, error: queryError } = await (postgres
      .from('users')
      .select('id, email, password, name, phone')
      .eq('email', email.toLowerCase()) as any);

    if (queryError) {
      console.error('[User Auth] PostgreSQL query error:', queryError);
      console.error('[User Auth] Query error code:', queryError?.code);
      console.error('[User Auth] Query error message:', queryError?.message);
      return NextResponse.json(
        { error: 'Failed to retrieve user credentials' },
        { status: 500 }
      );
    }

    console.log('[User Auth] Query result - users found:', users?.length || 0);

    if (!users || users.length === 0) {
      console.log(`[User Auth] No user found for email: ${email}`);
      console.log('[User Auth] Total users in database:', users?.length || 0);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];
    console.log(`[User Auth] Login attempt: Found user ${user.id} for email: ${email}`);
    console.log(`[User Auth] Stored password hash exists: ${!!user.password}`);
    console.log(`[User Auth] Stored password hash length: ${user.password?.length}`);

    // Verify password
    console.log(`[User Auth] Comparing passwords...`);
    let passwordMatch = false;
    try {
      passwordMatch = await bcryptjs.compare(password, user.password);
      console.log(`[User Auth] Password match result: ${passwordMatch}`);
    } catch (bcryptError: any) {
      console.error(`[User Auth] Error during password comparison:`, bcryptError);
      console.error(`[User Auth] Password received length: ${password?.length}`);
      console.error(`[User Auth] Password hash from DB: ${user.password?.substring(0, 20)}...`);
      return NextResponse.json(
        { error: 'Failed to verify password' },
        { status: 500 }
      );
    }
    
    if (!passwordMatch) {
      console.log(`[User Auth] Password mismatch for user ${user.id}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[User Auth] Unexpected login error:', error);
    console.error('[User Auth] Error type:', error?.constructor?.name);
    console.error('[User Auth] Error message:', error?.message);
    console.error('[User Auth] Error stack:', error?.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
