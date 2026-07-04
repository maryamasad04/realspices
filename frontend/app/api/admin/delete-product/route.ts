import { postgres } from '@/lib/postgresClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('[DELETE] Deleting product:', productId);

    // Delete order items referencing this product (cascade)
    const { data: deletedItems, error: deleteItemsError } = await postgres
      .from('orderitem')
      .delete()
      .eq('product_id', productId);

    if (deleteItemsError) {
      console.error('Error deleting order items:', deleteItemsError);
      return NextResponse.json(
        { error: `Failed to remove associated order items: ${deleteItemsError.message}` },
        { status: 400 }
      );
    }

    console.log('[DELETE] Deleted order items:', deletedItems?.length || 0);

    // Now delete the product
    const { data: deletedProduct, error: deleteError } = await postgres
      .from('product')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete product: ${deleteError.message}` },
        { status: 400 }
      );
    }

    console.log('[DELETE] Product deleted successfully:', deletedProduct);

    return NextResponse.json({ 
      success: true,
      data: deletedProduct, 
      message: 'Product deleted successfully' 
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
