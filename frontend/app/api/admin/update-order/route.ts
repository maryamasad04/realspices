import { NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status } = body || {};

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    console.log('[update-order] Updating order:', { orderId, status });

    const { data, error } = await postgres
      .from('order')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('[update-order] DB error:', error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[update-order] Route error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
