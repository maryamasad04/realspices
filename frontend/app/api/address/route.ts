import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';
import { verifyAuthHeader } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { street, city, state, pincode } = body;

    console.log('API route received address data:', { street, city, state, pincode, userId: decoded.id });

    // Validate required fields
    if (!street?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields. Street, city, state and pincode are required.' },
        { status: 400 }
      );
    }

    // Validate pincode (Indian pincode format)
    if (!/^\d{6}$/.test(pincode.trim())) {
      return NextResponse.json(
        { error: 'Invalid pincode. Please enter a valid 6-digit pincode.' },
        { status: 400 }
      );
    }

    const insertObj: any = {
      user_id: decoded.id,
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim()
    };

    console.log('Inserting address object:', insertObj);

    const result = await postgres
      .from('address')
      .insert([insertObj]);

    const { data, error } = result;

    if (error) {
      console.error('Database error in address API route:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return NextResponse.json(
        { error: error.message || 'Database error occurred.' },
        { status: 500 }
      );
    }

    console.log('Address saved successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Address saved successfully',
      address: data && data.length > 0 ? data[0] : null
    });

  } catch (error: any) {
    console.error('Address API error:', error);
    console.error('Error stack:', error.stack);
    
    let status = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('Missing required fields') || error.message.includes('Invalid')) {
      status = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Permission denied')) {
      status = 403;
      errorMessage = 'Permission denied. Please try again later.';
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
    // Get user's addresses
    const authHeader = request.headers.get('authorization');
    const decoded = verifyAuthHeader(authHeader);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data, error } = await postgres
      .from('address')
      .select('*')
      .eq('user_id', decoded.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching addresses:', error);
      
      return NextResponse.json(
        { error: error.message || 'Database error occurred.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      addresses: data || []
    });

  } catch (error: any) {
    console.error('Get addresses API error:', error);
    
    // Return empty array instead of error for table not found
    if (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
      return NextResponse.json({
        success: true,
        addresses: []
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}