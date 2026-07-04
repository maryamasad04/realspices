import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export async function GET(request: NextRequest) {
  try {
    // Fetch all orders from local postgres
    const { data: orders, error: ordersError } = await postgres
      .from('order')
      .select('*');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw new Error(ordersError.message || 'Failed to fetch orders');
    }

    // Fetch all order items
    const { data: items, error: itemsError } = await postgres
      .from('orderitem')
      .select('*');

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      throw new Error(itemsError.message || 'Failed to fetch order items');
    }

    console.log('[Admin Orders API] Fetched:', { 
      ordersCount: orders?.length || 0, 
      itemsCount: items?.length || 0 
    });

    return NextResponse.json({
      success: true,
      orders: orders || [],
      items: items || []
    });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders', details: error },
      { status: 500 }
    );
  }
}
