import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await (postgres
      .from('journey_milestones')
      .select('*')
      .order('display_order', { ascending: true }) as any);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data || [] });
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
    const { year, title, description, display_order } = body;

    if (!year?.trim() || !title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Year, title, and description are required.' },
        { status: 400 }
      );
    }

    let order = display_order;
    if (order === undefined || order === null) {
      const existing = await (postgres.from('journey_milestones').select('display_order') as any);
      const maxOrder = (existing.data || []).reduce(
        (max: number, row: { display_order: number }) => Math.max(max, row.display_order || 0),
        0
      );
      order = maxOrder + 1;
    }

    const { data, error } = await postgres.from('journey_milestones').insert([{
      year: year.trim(),
      title: title.trim(),
      description: description.trim(),
      display_order: Number(order),
    }]);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create milestone' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone created successfully',
      data: data?.[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
