import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required for reordering' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    for (const item of items) {
      if (!item.id || item.display_order === undefined) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Each item must have id and display_order' },
          { status: 400 }
        );
      }

      await client.query(
        'UPDATE "journey_milestones" SET display_order = $1, updated_at = NOW() WHERE id = $2',
        [Number(item.display_order), item.id]
      );
    }

    await client.query('COMMIT');

    const result = await client.query(
      'SELECT * FROM "journey_milestones" ORDER BY display_order ASC'
    );

    return NextResponse.json({
      success: true,
      message: 'Milestones reordered successfully',
      data: result.rows,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
