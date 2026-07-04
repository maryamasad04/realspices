import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API: Fetching users data...');
    
    const result = await postgres
      .from('users')
      .select('*');

    if (result.error) {
      console.error('Error fetching users:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch users data', data: [] },
        { status: 500 }
      );
    }

    const users = result.data || [];
    console.log('✅ Users data fetched:', users?.length);
    
    return NextResponse.json({
      success: true,
      data: users,
      count: users?.length || 0
    });
  } catch (error: any) {
    console.error('Unexpected error in users analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
