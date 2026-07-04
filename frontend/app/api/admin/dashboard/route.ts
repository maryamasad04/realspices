import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API: Fetching data...');
    
    // Fetch all data in parallel with error resilience
    const [query, product, order, orderitem, user, address, cart] = await Promise.all([
      postgres
        .from('query')
        .select('*')
        .then((res: any) => res)
        .catch((err: any) => { console.error('query error:', err); return { data: [] }; }),
      postgres
        .from('product')
        .select('*')
        .then((res: any) => res)
        .catch((err: any) => { console.error('product error:', err); return { data: [] }; }),
      postgres
        .from('order')
        .select('*')
        .then((res: any) => res)
        .catch(async (err: any) => {
          console.warn('order table error, trying orders:', err);
          return await postgres
            .from('order')
            .select('*')
            .then((res: any) => res)
            .catch(() => ({ data: [] }));
        }),
      postgres
        .from('orderitem')
        .select('*')
        .then((res: any) => res)
        .catch((err: any) => { console.error('orderitem error:', err); return { data: [] }; }),
      postgres
        .from('users')
        .select('*')
        .then((res: any) => res)
        .catch((err: any) => { console.error('users error:', err); return { data: [] }; }),
      postgres
        .from('address')
        .select('*')
        .then((res: any) => res)
        .catch((err: any) => { console.error('address error:', err); return { data: [] }; }),
      postgres
        .from('cart')
        .select('*')
        .then((res: any) => res)
        .catch((err: any) => { console.error('cart error:', err); return { data: [] }; })
    ]);

    const queries = query?.data || [];
    const products = product?.data || [];
    const orders = order?.data || [];
    const orderItems = orderitem?.data || [];
    const users = user?.data || [];
    const addresses = address?.data || [];
    const carts = cart?.data || [];

    // Process data for dashboard display
    const queriesList = (queries || []) as any[];
    const productsList = (products || []) as any[];
    const ordersList = (orders || []) as any[];
    const orderItemsList = (orderItems || []) as any[];
    const usersList = (users || []) as any[];
    const addressesList = (addresses || []) as any[];
    // Product stats
    const lowStockProducts = productsList.filter((p: any) => p.stock < 10 && p.stock > 0);
    const outOfStockProducts = productsList.filter((p: any) => p.stock === 0);
    const activeProducts = productsList.filter((p: any) => p.stock > 0 && (p.status === 'active' || p.status === null || !p.status));
    const totalInventoryValue = productsList.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.stock || 0)), 0);

    // Query stats
    const newQueries = queriesList.filter((q: any) => q.status === 'new');
    const recentQueries = queriesList.slice(0, 10);

    // Order stats
    const totalRevenue = ordersList.reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount || 0)), 0);
    const recentOrders = ordersList.slice(0, 10);
    const averageOrderValue = ordersList.length > 0 ? totalRevenue / ordersList.length : 0;

    // User stats
    const totalUsers = usersList.length;
    const newUsers = usersList.filter((u: any) => {
      const createdAt = new Date(u.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return createdAt > thirtyDaysAgo;
    });

    return NextResponse.json({
      // Overview stats
      stats: {
        totalContacts: queriesList.length,
        newContacts: newQueries.length,
        totalProducts: productsList.length,
        totalOrders: ordersList.length,
        totalUsers: totalUsers,
        revenue: `$${totalRevenue.toFixed(2)}`,
        averageOrderValue: `$${averageOrderValue.toFixed(2)}`
      },

      // Detailed data
      queries: {
        total: queriesList.length,
        new: newQueries.length,
        recent: recentQueries,
        byStatus: {
          new: newQueries.length,
          processing: queriesList.filter((q: any) => q.status === 'processing').length,
          resolved: queriesList.filter((q: any) => q.status === 'resolved').length,
          closed: queriesList.filter((q: any) => q.status === 'closed').length
        }
      },

      products: {
        total: productsList.length,
        active: activeProducts.length,
        inactive: productsList.filter((p: any) => p.status === 'inactive').length,
        discontinued: productsList.filter((p: any) => p.status === 'discontinued').length,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        inventoryValue: totalInventoryValue.toFixed(2),
        topProducts: productsList
          .sort((a: any, b: any) => (b.reviews || 0) - (a.reviews || 0))
          .slice(0, 5),
        lowStockItems: lowStockProducts.slice(0, 5),
        recentAdditions: productsList.slice(0, 5)
      },

      orders: {
        total: ordersList.length,
        totalRevenue: totalRevenue.toFixed(2),
        averageValue: averageOrderValue.toFixed(2),
        recent: recentOrders,
        byStatus: {
          pending: ordersList.filter((o: any) => o.status === 'pending').length,
          completed: ordersList.filter((o: any) => o.status === 'completed').length,
          cancelled: ordersList.filter((o: any) => o.status === 'cancelled').length
        }
      },

      users: {
        total: totalUsers,
        newThisMonth: newUsers.length,
        recent: usersList.slice(0, 5)
      },

      // Summary for quick view
      summary: {
        lastUpdate: new Date().toISOString(),
        totalItems: productsList.length + ordersList.length + queriesList.length,
        pendingActions: newQueries.length + outOfStockProducts.length,
        alerts: [
          ...lowStockProducts.slice(0, 3).map((p: any) => ({
            type: 'low_stock',
            message: `${p.name} has only ${p.stock} units left`,
            severity: 'warning'
          })),
          ...outOfStockProducts.slice(0, 3).map((p: any) => ({
            type: 'out_of_stock',
            message: `${p.name} is out of stock`,
            severity: 'critical'
          })),
          ...newQueries.slice(0, 3).map((q: any) => ({
            type: 'new_query',
            message: `New inquiry from ${q.name}: ${q.subject}`,
            severity: 'info'
          }))
        ]
      }
    });
  } catch (error: any) {
    console.error('❌ Admin dashboard fetch error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch dashboard data',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
