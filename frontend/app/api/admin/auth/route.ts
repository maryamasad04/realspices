import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import bcryptjs from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, action } = body;

    // Validate required fields
    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if admin exists
    const { data: admins, error: fetchError } = await postgres
      .from('admin')
      .select('*');

    if (fetchError) {
      console.error('Database error during admin fetch:', fetchError);
      return NextResponse.json(
        { error: 'Database error', details: fetchError?.message },
        { status: 500 }
      );
    }

    // Ensure admins is an array
    const adminsList = Array.isArray(admins) ? admins : [];
    const existingAdmin = adminsList.find((a: any) => a.username === username.toLowerCase());

    if (action === 'login') {
      // Login action
      if (existingAdmin) {
        // Admin exists - verify password
        const passwordMatch = await bcryptjs.compare(password, existingAdmin.password);
        if (!passwordMatch) {
          return NextResponse.json(
            { error: 'Invalid username or password' },
            { status: 401 }
          );
        }

        // Login successful
        return NextResponse.json(
          {
            success: true,
            message: 'Admin login successful',
            admin: {
              admin_id: existingAdmin.admin_id,
              username: existingAdmin.username,
              created_at: existingAdmin.created_at
            }
          },
          { status: 200 }
        );
      } else {
        // First time login - create admin account
        const hashedPassword = await bcryptjs.hash(password, 10);
        
        // Build insert payload explicitly (only username and password, no auto-IDs)
        const insertPayload = {
          username: username.toLowerCase(),
          password: hashedPassword
        };
        console.log('[Admin Auth] Creating new admin with payload:', insertPayload);
        
        const { data: newAdmins, error: insertError } = await postgres
          .from('admin')
          .insert([insertPayload]);

        if (insertError) {
          console.error('Error creating admin account:', insertError);
          console.error('Error details:', {
            code: insertError?.code,
            message: insertError?.message,
            detail: insertError?.detail,
            constraint: insertError?.constraint
          });
          return NextResponse.json(
            { 
              error: 'Failed to create admin account',
              details: insertError?.message 
            },
            { status: 500 }
          );
        }

        if (!newAdmins || newAdmins.length === 0) {
          console.error('No data returned after inserting admin account');
          return NextResponse.json(
            { error: 'Failed to create admin account' },
            { status: 500 }
          );
        }

        const newAdmin = newAdmins[0];

        return NextResponse.json(
          {
            success: true,
            message: 'Admin account created and logged in successfully',
            admin: {
              admin_id: newAdmin.admin_id,
              username: newAdmin.username,
              created_at: newAdmin.created_at
            }
          },
          { status: 201 }
        );
      }
    } else if (action === 'register') {
      // Register action - explicitly create new admin
      if (existingAdmin) {
        return NextResponse.json(
          { error: 'Admin with this username already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      
      // Build insert payload explicitly (only username and password, no auto-IDs)
      const insertPayload = {
        username: username.toLowerCase(),
        password: hashedPassword
      };
      console.log('[Admin Auth] Registering new admin with payload:', insertPayload);
      
      const { data: newAdmins, error: insertError } = await postgres
        .from('admin')
        .insert([insertPayload]);

      if (insertError) {
        console.error('Error registering admin account:', insertError);
        console.error('Error details:', {
          code: insertError?.code,
          message: insertError?.message,
          detail: insertError?.detail,
          constraint: insertError?.constraint
        });
        return NextResponse.json(
          { 
            error: 'Failed to create admin account',
            details: insertError?.message 
          },
          { status: 500 }
        );
      }

      if (!newAdmins || newAdmins.length === 0) {
        console.error('No data returned after inserting admin account');
        return NextResponse.json(
          { error: 'Failed to create admin account' },
          { status: 500 }
        );
      }

      const newAdmin = newAdmins[0];

      return NextResponse.json(
        {
          success: true,
          message: 'Admin account registered successfully',
          admin: {
            admin_id: newAdmin.admin_id,
            username: newAdmin.username,
            created_at: newAdmin.created_at
          }
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "login" or "register"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Admin authentication error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Internal server error', details: error?.toString?.() },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    const { data: admins, error } = await postgres
      .from('admin')
      .select('admin_id, username, created_at');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admin details' },
        { status: 500 }
      );
    }

    const admin = admins?.find((a: any) => a.username === username.toLowerCase());

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
