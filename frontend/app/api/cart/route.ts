import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { verifyAuthHeader } from '@/lib/jwt';

// Helper function to extract user ID from JWT token
function getUserIdFromToken(authHeader: string | null): string | null {
  const decoded = verifyAuthHeader(authHeader);
  return decoded ? decoded.id : null;
}

// Helper function to get or create cart for user
async function getOrCreateCart(userId: string) {
  // Try to get existing cart
  let { data: cart, error } = await postgres
    .from('cart')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error || !cart) {
    // Create new cart if doesn't exist
    const { data: newCart, error: createError } = await postgres
      .from('cart')
      .insert([{ user_id: userId }]);

    if (createError) throw createError;
    return newCart && newCart.length > 0 ? newCart[0].id : null;
  }

  return cart.id;
}

// GET - Fetch user's cart items
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromToken(authHeader);

    console.log('[Cart API] GET - Fetching cart for user:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's cart
    const { data: cart } = await postgres
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      console.log('[Cart API] GET - No cart found, returning empty array');
      return NextResponse.json({ success: true, cartItems: [] });
    }

    console.log('[Cart API] GET - Found cart, fetching items for cart_id:', cart.id);

    // Get cart items
    const { data, error } = await postgres
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Cart API] GET - PostgreSQL error fetching cart items:', error);
      console.error('[Cart API] Error code:', error?.code);
      console.error('[Cart API] Error message:', error?.message);
      
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return NextResponse.json({ success: true, cartItems: [] });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Cart API] GET - Successfully fetched', data?.length || 0, 'cart items');
    return NextResponse.json({ success: true, cartItems: data || [] });
  } catch (error: any) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Add or update cart item
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromToken(authHeader);

    console.log('[Cart API] POST - Adding item to cart for user:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, product_name, price, quantity, original_price, image, grade, weight } = body;

    console.log('[Cart API] POST - Request body:', { product_id, product_name, quantity });

    if (!product_id || !product_name || price === undefined || quantity === undefined) {
      console.log('[Cart API] POST - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert product_id to integer
    const productIdInt = parseInt(product_id.toString());

    // Get or create cart for user
    const cartId = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const { data: existingItem } = await postgres
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productIdInt)
      .single();

    let result;

    if (existingItem) {
      console.log('[Cart API] POST - Item exists, updating quantity from', existingItem.quantity, 'to', existingItem.quantity + quantity);
      // Update existing item quantity
      const { data, error } = await postgres
        .from('cart_items')
        .update({ 
          quantity: existingItem.quantity + quantity,
          price: parseFloat(price),
          original_price: original_price ? parseFloat(original_price) : null,
          image,
          grade,
          weight,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id);

      if (error) {
        console.error('[Cart API] POST - Error updating cart item:', error);
        throw error;
      }
      result = data;
      console.log('[Cart API] POST - Item updated successfully');
    } else {
      console.log('[Cart API] POST - Item does not exist, creating new cartitem with quantity:', quantity);
      // Insert new item
      const { data, error } = await postgres
        .from('cart_items')
        .insert([{
          cart_id: cartId,
          product_id: productIdInt,
          product_name,
          price: parseFloat(price),
          quantity,
          original_price: original_price ? parseFloat(original_price) : null,
          image,
          grade,
          weight
        }]);

      if (error) {
        console.error('[Cart API] POST - Error creating cart item:', error);
        throw error;
      }
      result = data && data.length > 0 ? data[0] : null;
      console.log('[Cart API] POST - Item created successfully');
    }

    console.log('[Cart API] POST - Returning success response');
    return NextResponse.json({ success: true, cartItem: result });
  } catch (error: any) {
    console.error('[Cart API] POST - Unexpected error:', error);
    console.error('[Cart API] Error message:', error?.message);
    console.error('[Cart API] Error code:', error?.code);
    
    if (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
      return NextResponse.json({ 
        error: 'Cart table not found. Please run the cart_schema.sql in your database.',
        success: false 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromToken(authHeader);

    console.log('[Cart API] PUT - Updating cart item for user:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { cart_item_id, quantity } = body;

    console.log('[Cart API] PUT - Updating item:', { cart_item_id, quantity });

    if (!cart_item_id || quantity === undefined) {
      console.log('[Cart API] PUT - Missing cart_item_id or quantity');
      return NextResponse.json({ error: 'Missing cart_item_id or quantity' }, { status: 400 });
    }

    if (quantity <= 0) {
      console.log('[Cart API] PUT - Invalid quantity:', quantity);
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }

    // Get user's cart to verify ownership
    const { data: cart } = await postgres
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Update cart item quantity
    const { data, error } = await postgres
      .from('cart_items')
      .update({ 
        quantity: parseInt(quantity.toString()),
        updated_at: new Date().toISOString()
      })
      .eq('id', cart_item_id)
      .eq('cart_id', cart.id);

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Cart item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cartItem: data[0] });
  } catch (error: any) {
    console.error('[Cart API] PUT - Unexpected error:', error);
    console.error('[Cart API] Error message:', error?.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove cart item
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromToken(authHeader);

    console.log('[Cart API] DELETE - Removing item from cart for user:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');
    const productId = searchParams.get('product_id');

    console.log('[Cart API] DELETE - Parameters:', { cartItemId, productId });

    if (!cartItemId && !productId) {
      console.log('[Cart API] DELETE - Missing cart item ID or product ID');
      return NextResponse.json({ error: 'Cart item ID or Product ID required' }, { status: 400 });
    }

    // Get user's cart to verify ownership
    const { data: cart } = await postgres
      .from('cart')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    let deleteData;
    let deleteError;
    
    if (cartItemId) {
      ({ data: deleteData, error: deleteError } = await postgres
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('cart_id', cart.id));
    } else if (productId) {
      const productIdInt = parseInt(productId);
      ({ data: deleteData, error: deleteError } = await postgres
        .from('cart_items')
        .delete()
        .eq('product_id', productIdInt)
        .eq('cart_id', cart.id));
    }

    if (deleteError) throw deleteError;

    console.log('[Cart API] DELETE - Item removed successfully');
    return NextResponse.json({ success: true, message: 'Cart item removed' });
  } catch (error: any) {
    console.error('[Cart API] DELETE - Unexpected error:', error);
    console.error('[Cart API] Error message:', error?.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
