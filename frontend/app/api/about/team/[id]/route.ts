import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.designation !== undefined) updates.designation = String(body.designation).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.image !== undefined) updates.image = body.image?.trim() || null;
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Status must be active or inactive' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await postgres
      .from('team_members')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update team member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team member updated successfully',
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
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 });
    }

    const { data, error } = await postgres
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete team member' },
        { status: 500 }
      );
    }

    if (!data?.length) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
