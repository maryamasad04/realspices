import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { verifyAuthHeader } from '@/lib/jwt';
import { ensureOrderSchema } from '@/lib/ensureOrderSchema';

// Helper to safely serialize objects that may contain BigInt values
function safeSerialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

export async function POST(request: NextRequest) {
  try {
    await ensureOrderSchema();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      orderId, 
      orderDetails, 
      totalAmount, 
      shippingAddress, 
      billingAddress, 
      addressId,
      paymentMethod, 
      paymentStatus,
      orderStatus,
    } = body;

    console.log('API route received order data:', { orderId, totalAmount, paymentMethod, userId: decoded.id });

    // Validate required fields
    if (!orderId?.trim() || !orderDetails || !totalAmount || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields. Order ID, details, total amount, and shipping address are required.' },
        { status: 400 }
      );
    }

    // Validate total amount
    if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount.' },
        { status: 400 }
      );
    }

    const orderInsert: Record<string, unknown> = {
      user_id: decoded.id,
      order_id: orderId.trim(),
      order_details: JSON.stringify(orderDetails),
      total_amount: parseFloat(totalAmount),
      shipping_address: JSON.stringify(shippingAddress),
      billing_address: JSON.stringify(billingAddress || shippingAddress),
      payment_method: paymentMethod?.trim() || 'online',
      payment_status: paymentStatus?.trim() || 'pending',
      status: orderStatus?.trim() || 'pending',
    };

    if (addressId) {
      orderInsert.address_id = addressId;
    }

    const { data: orderData, error: orderError } = await postgres
      .from('order')
      .insert([orderInsert]);

    if (orderError) {
      console.error('PostgreSQL error in order API route:', orderError);
      return NextResponse.json(
        { error: orderError.message || 'Database error occurred.' },
        { status: 500 }
      );
    }

    // Fetch the inserted order by order_id to get the auto-generated id
    const { data: fetchedOrders, error: fetchError } = await postgres
      .from('order')
      .select('*')
      .eq('order_id', orderId.trim())
      .limit(1);

    if (fetchError || !fetchedOrders || fetchedOrders.length === 0) {
      console.error('Failed to fetch inserted order:', fetchError);
      return NextResponse.json(
        { error: 'Failed to retrieve inserted order' },
        { status: 500 }
      );
    }

    const insertedOrder = fetchedOrders[0];

    // Save order items in orderitem table
    // orderDetails should be an array of items
    if (orderDetails && Array.isArray(orderDetails)) {
      const orderItemsToInsert = orderDetails.map((item: any) => ({
        order_id: insertedOrder.id,
        product_id: item.id,
        product_name: item.product_name || item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        grade: item.grade,
        weight: item.weight
      }));

      const { error: orderItemsError } = await postgres
        .from('orderitem')
        .insert(orderItemsToInsert);

      if (orderItemsError) {
        console.error('Error saving order items:', orderItemsError);
        return NextResponse.json({
          success: false,
          message: 'Order saved, but failed to save order items',
          order: insertedOrder,
          error: orderItemsError.message
        }, { status: 500 });
      }
    }

    console.log('Order and items saved successfully:', insertedOrder);

    return NextResponse.json({
      success: true,
      message: 'Order and items created successfully',
      order: insertedOrder
    });

  } catch (error: any) {
    console.error('Order API error:', error);
    
    let status = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('Missing required fields') || error.message.includes('Invalid')) {
      status = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Permission denied')) {
      status = 403;
      errorMessage = 'Permission denied. Please try again later.';
    } else if (error.message.includes('duplicate key')) {
      status = 409;
      errorMessage = 'Order ID already exists. Please try again.';
    } else {
      errorMessage = error.message || 'Internal server error';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('order_id');

    let { data: orders, error: ordersError } = { data: null, error: null } as any;

    if (orderId) {
      // Fetch specific order by order_id
      const result = await postgres
        .from('order')
        .select('*')
        .eq('user_id', decoded.id)
        .eq('order_id', orderId);
      
      orders = result.data || [];
      ordersError = result.error;
    } else {
      // Fetch all orders for authenticated user (newest first)
      const result = await postgres
        .from('order')
        .select('*')
        .eq('user_id', decoded.id)
        .order('created_at', { ascending: false });
      
      orders = result.data || [];
      ordersError = result.error;
    }

    if (ordersError) {
      console.error('PostgreSQL error fetching orders:', ordersError);
      return NextResponse.json(
        { error: ordersError.message || 'Database error occurred.' },
        { status: 500 }
      );
    }

    // Fetch order items for each order
    let ordersWithDetails = [];
    for (const order of orders || []) {
      // Fetch order items for this order
      const itemsResult = await postgres
        .from('orderitem')
        .select('*')
        .eq('order_id', order.id);
      
      const items = itemsResult.data || [];

      // Parse JSONB fields if they're strings
      const parsedOrder = {
        ...order,
        order_details: typeof order.order_details === 'string' ? JSON.parse(order.order_details) : order.order_details,
        shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
        billing_address: typeof order.billing_address === 'string' ? JSON.parse(order.billing_address) : order.billing_address,
        order_items: items
      };

      ordersWithDetails.push(parsedOrder);
    }

    return NextResponse.json({
      success: true,
      orders: safeSerialize(ordersWithDetails)
    });

  } catch (error: any) {
    console.error('Get orders API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { orderId } = (body || {}) as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Fetch the order first
    const ordersResult = await postgres
      .from('order')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', decoded.id)
      .limit(1);
    
    const order = ordersResult.data?.[0];

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { error: updateErr } = await postgres
      .from('order')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId)
      .eq('user_id', decoded.id);

    if (updateErr) {
      console.error('Failed to cancel order:', updateErr);
      return NextResponse.json({ error: updateErr.message || 'Failed to cancel order' }, { status: 500 });
    }

    // Fetch the updated order
    const { data: updatedOrders, error: fetchErr } = await postgres
      .from('order')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', decoded.id)
      .limit(1);

    const updated = updatedOrders?.[0];

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Delete (cancel) order API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}