import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body as { userId?: any };

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const resolved: { email?: string | null; phone?: string | null } = {};

    // Try different table names and column combinations for email/phone
    const candidateTables = ['users', 'profiles', 'user', 'profile'];
    
    for (const t of candidateTables) {
      try {
        // Try fetching by id field
        const { data: rowsById } = await postgres
          .from(t)
          .select('email, phone');
        
        if (rowsById && rowsById.length > 0) {
          const row = rowsById.find((r: any) => r.id === userId);
          if (row) {
            resolved.email = row.email || null;
            resolved.phone = row.phone || null;
            break;
          }
        }

        // Try fetching by user_id field
        const { data: rowsByUserId } = await postgres
          .from(t)
          .select('email, phone');
        
        if (rowsByUserId && rowsByUserId.length > 0) {
          const row = rowsByUserId.find((r: any) => r.user_id === userId);
          if (row) {
            resolved.email = row.email || null;
            resolved.phone = row.phone || null;
            break;
          }
        }
      } catch (e) {
        // ignore missing table/column and try next
        console.debug(`Table ${t} not available or error occurred`);
      }
    }

    console.log('[user-contact] Resolved contact info for userId:', userId, resolved);

    return NextResponse.json({ success: true, email: resolved.email || null, phone: resolved.phone || null });
  } catch (error: any) {
    console.error('[user-contact] API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
