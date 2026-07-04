import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { verifyAuthHeader } from '@/lib/jwt';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Get user information
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const usersResult = await postgres
      .from('users')
      .select('*');

    const data = usersResult.data?.filter((u: any) => u.id === decoded.id).slice(0, 1) || [];
    const error = usersResult.error;

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: data[0] });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user information
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updateResult = await postgres
      .from('users')
      .update(updateData)
      .eq('id', decoded.id);

    const data = updateResult.data || [];
    const error = updateResult.error;

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: data[0] });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
