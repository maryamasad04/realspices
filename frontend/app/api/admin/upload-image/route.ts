import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `product-${timestamp}-${randomStr}.${ext}`;

    // Save to public folder
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const buffer = await file.arrayBuffer();
      const filePath = join(uploadDir, filename);
      
      await writeFile(filePath, Buffer.from(buffer));

      // Return public URL path
      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json(
        {
          success: true,
          message: 'Image uploaded successfully',
          filename: filename,
          url: publicUrl
        },
        { status: 200 }
      );
    } catch (fsError: any) {
      console.error('File system error:', fsError);
      return NextResponse.json(
        { error: 'Failed to save image: ' + fsError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload: ' + error.message },
      { status: 500 }
    );
  }
}
