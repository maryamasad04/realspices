import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API: Fetching orders data...');
    
    const result = await postgres
      .from('order')
      .select('*');

    if (result.error) {
      console.error('Error fetching orders:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch orders data', data: [] },
        { status: 500 }
      );
    }

    const orders = result.data || [];
    console.log('✅ Orders data fetched:', orders?.length);
    
    return NextResponse.json({
      success: true,
      data: orders,
      count: orders?.length || 0
    });
  } catch (error: any) {
    console.error('Unexpected error in orders analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
