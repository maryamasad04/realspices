import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('=== API Route Called ===');
    
    // Get all products
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const queryResult = await postgres
      .from('product')
      .select('*')
      .order('created_at', { ascending: false });

    let data = queryResult.data || [];
    const error = queryResult.error;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { 
          error: error.message, 
          details: error.details,
          hint: error.hint,
          code: error.code 
        },
        { status: 500 }
      );
    }

    // Filter by status if provided
    if (status) {
      data = data.filter((p: any) => p.status === status);
    }

    console.log('Successfully fetched products:', data?.length || 0);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch products',
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept both snake_case and camelCase for original price
    const { name, grade, weight, price, original_price, originalPrice, rating, reviews, image, badge, description, features, stock, status, sku } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required fields.' },
        { status: 400 }
      );
    }

    // Build insert object matching DB columns
    let featuresValue: any = null;
    if (features) {
      if (Array.isArray(features)) {
        featuresValue = features;
      } else if (typeof features === 'string') {
        try {
          featuresValue = JSON.parse(features);
        } catch (e) {
          featuresValue = features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
        }
      }
    }

    const insertObj = {
      name: name.trim(),
      grade: grade?.trim() || null,
      weight: weight?.trim() || null,
      price: parseFloat(price),
      originalPrice: (originalPrice ?? original_price) ? parseFloat((originalPrice ?? original_price) as any) : null,
      rating: rating ? parseFloat(rating) : null,
      reviews: reviews ? parseInt(reviews) : null,
      image: image?.trim() || null,
      badge: badge?.trim() || null,
      description: description?.trim() || null,
      features: featuresValue,
      stock: stock ? parseInt(stock) : 0,
      status: status || 'active',
      sku: sku?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Log payload sent to DB for debugging
    console.log('[api/products] insert payload:', insertObj);

    // Insert product into database
    const { data, error } = await postgres
      .from('product')
      .insert([insertObj]);

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data && data.length > 0 ? data[0] : null);
  } catch (error: any) {
    console.error('API POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    // Filter out fields that don't exist in the product table
    const validFields = ['name', 'grade', 'weight', 'price', 'originalPrice', 'rating', 'reviews', 'image', 'badge', 'description', 'features', 'stock', 'status', 'sku'];
    const filteredUpdates: any = {};
    
    Object.keys(updates).forEach(key => {
      if (validFields.includes(key) && updates[key] !== undefined) {
        const value = updates[key];
        
        // Handle features: ensure it's properly formatted for JSONB
        if (key === 'features') {
          if (value === null || value === undefined) {
            filteredUpdates[key] = null;
          } else if (Array.isArray(value)) {
            // Already an array, keep as-is (JSON.stringify will handle it in the DB)
            filteredUpdates[key] = value;
          } else if (typeof value === 'string') {
            // Parse string to array
            try {
              filteredUpdates[key] = JSON.parse(value);
            } catch (e) {
              // If not valid JSON, split by comma
              filteredUpdates[key] = value.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
            }
          } else {
            filteredUpdates[key] = value;
          }
        } else {
          // Type coercion for numeric fields
          if ((key === 'price' || key === 'originalPrice' || key === 'rating') && typeof value === 'string') {
            filteredUpdates[key] = parseFloat(value);
          } else if ((key === 'stock' || key === 'reviews') && typeof value === 'string') {
            filteredUpdates[key] = parseInt(value, 10);
          } else {
            filteredUpdates[key] = value;
          }
        }
      }
    });

    console.log('[PUT] Product update payload:', { id, filteredUpdates });

    // Update product in database
    const { data, error } = await postgres
      .from('product')
      .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Database error in update product API route:', error);
      return NextResponse.json(
        { error: error.message || 'Database error occurred.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data && data.length > 0 ? data[0] : null
    });

  } catch (error: any) {
    console.error('Update product API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    // Delete order items referencing this product (cascade)
    const { error: deleteItemsError } = await postgres
      .from('orderitem')
      .delete()
      .eq('product_id', id);

    if (deleteItemsError) {
      console.error('Error deleting order items:', deleteItemsError);
      return NextResponse.json(
        { error: `Failed to remove associated order items: ${deleteItemsError.message}` },
        { status: 400 }
      );
    }

    // Delete the product
    const { data, error } = await postgres
      .from('product')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: `Failed to delete product: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully',
      data: data && data.length > 0 ? data[0] : null
    });
  } catch (error: any) {
    console.error('Delete product API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}