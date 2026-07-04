import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API: Fetching orderitems data...');
    
    const result = await postgres
      .from('orderitem')
      .select('*');

    if (result.error) {
      console.error('Error fetching orderitems:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch orderitems data', data: [] },
        { status: 500 }
      );
    }

    const orderitems = result.data || [];
    console.log('✅ Orderitems data fetched:', orderitems?.length);
    
    return NextResponse.json({
      success: true,
      data: orderitems,
      count: orderitems?.length || 0
    });
  } catch (error: any) {
    console.error('Unexpected error in orderitems analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
