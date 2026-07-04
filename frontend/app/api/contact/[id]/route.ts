import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    // Extract ID from URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, updated_at } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the contact record
    const updateResult = await postgres
      .from('query')
      .update({
        status,
        updated_at: updated_at || new Date().toISOString()
      })
      .eq('id', id);

    const data = updateResult.data || [];
    const error = updateResult.error;

    if (error) {
      console.error('Database error updating contact:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update contact' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      data: data[0] || null
    });

  } catch (error: any) {
    console.error('Contact update API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
