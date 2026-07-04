import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get('active') === 'true';

    const result = await (postgres
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true }) as any);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    let data = result.data || [];
    if (activeOnly) {
      data = data.filter((member: { status: string }) => member.status === 'active');
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, designation, description, image, display_order, status } = body;

    if (!name?.trim() || !designation?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Name, designation, and description are required.' },
        { status: 400 }
      );
    }

    const memberStatus = status === 'inactive' ? 'inactive' : 'active';

    let order = display_order;
    if (order === undefined || order === null) {
      const existing = await (postgres.from('team_members').select('display_order') as any);
      const maxOrder = (existing.data || []).reduce(
        (max: number, row: { display_order: number }) => Math.max(max, row.display_order || 0),
        0
      );
      order = maxOrder + 1;
    }

    const { data, error } = await postgres.from('team_members').insert([{
      name: name.trim(),
      designation: designation.trim(),
      description: description.trim(),
      image: image?.trim() || null,
      display_order: Number(order),
      status: memberStatus,
    }]);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create team member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team member created successfully',
      data: data?.[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
