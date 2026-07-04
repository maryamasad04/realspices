import { postgres } from '@/lib/postgresClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('[cancel-order] Cancelling order:', { orderId, reason });

    // Update order with cancelled status and cancellation reason
    const updateData: any = {
      status: 'cancelled'
    };

    // Only include cancellation_reason if it exists
    if (reason) {
      updateData.cancellation_reason = reason;
    }

    const { data, error } = await postgres
      .from('order')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('[cancel-order] DB error:', error);
      return NextResponse.json({ error: error.message || 'Failed to cancel order' }, { status: 400 });
    }

    console.log('[cancel-order] Order cancelled successfully:', data);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[cancel-order] Route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

