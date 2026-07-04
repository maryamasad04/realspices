import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.year !== undefined) updates.year = String(body.year).trim();
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await postgres
      .from('journey_milestones')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update milestone' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone updated successfully',
      data: data?.[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    const { data, error } = await postgres
      .from('journey_milestones')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete milestone' },
        { status: 500 }
      );
    }

    if (!data?.length) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
