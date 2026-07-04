import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Fetch queries count
    const { data: queries, error: queriesError } = await (postgres
      .from('query')
      .select('*') as any);

    if (queriesError) {
      console.error('Error fetching queries:', queriesError);
      return NextResponse.json(
        { error: 'Failed to fetch queries', details: queriesError },
        { status: 500 }
      );
    }

    // Fetch products count
    const { data: products, error: productsError } = await (postgres
      .from('product')
      .select('id') as any);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      // Continue with 0 if products fetch fails
    }

    // Fetch orders count
    let ordersCount = 0;
    const { data: orders, error: ordersError } = await (postgres
      .from('order')
      .select('id') as any);

    if (!ordersError && orders) {
      ordersCount = orders.length;
    }

    const queriesData = queries || [];
    const productsData = products || [];
    const newQueries = queriesData.filter((q: any) => q.status === 'new') || [];
    const recentQueries = queriesData.slice(0, 5) || [];
    const productCount = productsData.length || 0;

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalContacts: queriesData.length || 0,
          newContacts: newQueries.length,
          totalProducts: productCount,
          totalOrders: ordersCount,
          revenue: '$12,840'
        },
        recentQueries
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
