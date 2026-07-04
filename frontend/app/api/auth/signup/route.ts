import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { signToken } from '@/lib/jwt';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    console.log('[User Auth] === SIGNUP ATTEMPT ===');
    console.log('[User Auth] Request body keys:', Object.keys(body));

    // Validate required fields
    if (!email?.trim() || !password?.trim() || !name?.trim()) {
      console.log('[User Auth] Missing required signup fields');
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists in local PostgreSQL database
    console.log(`[User Auth] Signup attempt for email: ${email}`);
    const usersResult = await postgres
      .from('users')
      .select('id, email');
    
    const existingUsers = usersResult.data?.filter((u: any) => u.email?.toLowerCase() === email.toLowerCase()) || [];
    const checkError = usersResult.error;

    if (checkError) {
      console.error('[User Auth] PostgreSQL error checking existing user:', checkError);
      console.error('[User Auth] Error code:', checkError?.code);
      console.error('[User Auth] Error message:', checkError?.message);
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      );
    }

    console.log('[User Auth] Existing users found:', existingUsers?.length || 0);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    console.log(`[User Auth] Signing up user with email: ${email}`);
    console.log(`[User Auth] Password length received: ${password?.length}`);
    let hashedPassword = '';
    try {
      hashedPassword = await bcryptjs.hash(password, 10);
      console.log(`[User Auth] Password hashed successfully, hash length: ${hashedPassword?.length}`);
      console.log(`[User Auth] Hash preview (first 20 chars): ${hashedPassword?.substring(0, 20)}`);
    } catch (bcryptError: any) {
      console.error(`[User Auth] Error during password hashing:`, bcryptError);
      return NextResponse.json(
        { error: 'Failed to hash password' },
        { status: 500 }
      );
    }

    // Create user
    console.log(`[User Auth] Creating user record with hashed password`);
    const { data: newUsers, error: insertError } = await postgres
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null
      }]);
    
    if (insertError) {
      console.error(`[User Auth] Error code: ${insertError?.code}`);
      console.error(`[User Auth] Error message: ${insertError?.message}`);
      console.error(`[User Auth] Error detail: ${insertError?.detail}`);
      console.error('DB error creating user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    if (!newUsers || newUsers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const user = newUsers[0];

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
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[User Auth] Unexpected signup error:', error);
    console.error('[User Auth] Error type:', error?.constructor?.name);
    console.error('[User Auth] Error message:', error?.message);
    console.error('[User Auth] Error stack:', error?.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
