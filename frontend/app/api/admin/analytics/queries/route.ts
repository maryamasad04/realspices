import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API: Fetching queries data...');
    
    const result = await postgres
      .from('query')
      .select('*');

    if (result.error) {
      console.error('Error fetching queries:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch queries data', data: [] },
        { status: 500 }
      );
    }

    const queries = result.data || [];
    console.log('✅ Queries data fetched:', queries?.length);
    
    return NextResponse.json({
      success: true,
      data: queries,
      count: queries?.length || 0
    });
  } catch (error: any) {
    console.error('Unexpected error in queries analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
