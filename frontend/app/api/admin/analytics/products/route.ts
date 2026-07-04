import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API: Fetching products data...');
    
    const result = await postgres
      .from('product')
      .select('*');

    if (result.error) {
      console.error('Error fetching products:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch products data', data: [] },
        { status: 500 }
      );
    }

    const products = result.data || [];
    console.log('✅ Products data fetched:', products?.length);
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products?.length || 0
    });
  } catch (error: any) {
    console.error('Unexpected error in products analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
