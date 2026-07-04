import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/lib/postgresClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, status } = body;

    console.log('API route received contact form data:', { name, email, subject });

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields. Name, email, subject, and message are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Insert into PostgreSQL
    const { data, error } = await postgres
      .from('query')
      .insert([{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: status || 'new'
      }]);

    if (error) {
      console.error('Database error in API route:', error);
      return NextResponse.json(
        { error: error.message || 'Database error occurred.' },
        { status: 500 }
      );
    }

    console.log('Contact form submitted successfully');

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      data: data
    });

  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    
    const result = await postgres
      .from('query')
      .select('*');

    let data = result.data || [];

    if (status) {
      data = data.filter((item: any) => item.status === status);
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error: any) {
    console.error('Contact API GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}