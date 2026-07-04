// API route for updating cart item quantities
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const { id, quantity } = await request.json();

    if (!id || typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Cart data is primarily handled by localStorage on client
    // This endpoint mainly serves for server-side logging if needed
    console.log(`User ${decoded.id} updated cart item ${id} to quantity ${quantity}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Cart item quantity updated',
      userId: decoded.id,
      itemId: id,
      quantity
    });

  } catch (error: any) {
    console.error('Cart update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}