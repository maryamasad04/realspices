# Admin Product Image Upload Setup

## Overview
The admin inventory system now supports uploading product images directly from the local file system. Images are stored in Supabase Storage and get a public URL automatically.

## Setup Steps

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **Create a new bucket**
4. Name the bucket: `product-images`
5. **Uncheck** "Make bucket private" (so images are publicly accessible)
6. Click **Create bucket**

### 2. Set Up Storage Policies (Optional - for additional security)

If you want to restrict uploads to authenticated admins, go to the bucket settings and add RLS policies. For now, the API route handles security via service role.

### 3. Verify API Endpoint

The image upload API is at: `/api/admin/upload-image`

**Endpoints:**
- **POST** `/api/admin/upload-image` - Upload image file
  - Accepts: Form data with `file` field
  - Returns: `{ success: true, url: "public-url", filename: "..." }`

## Usage in Admin Inventory

### In the "Add New Product" Form:

1. **Option 1 - Manual URL:** 
   - Enter image URL directly in the "Or enter image URL" field
   - Use absolute URLs (e.g., `https://...`) or Supabase storage URLs

2. **Option 2 - Upload File:**
   - Click the upload area or drag & drop an image
   - Supported formats: PNG, JPG, WebP, GIF
   - Max file size: 5MB
   - Image preview displays after successful upload
   - Click the X button to remove and choose another

### Features:
- ✅ Real-time preview of uploaded image
- ✅ File size validation (max 5MB)
- ✅ File type validation (JPEG, PNG, WebP, GIF only)
- ✅ Automatic unique filename generation (prevents overwrites)
- ✅ Public URL automatically set to the image field
- ✅ Remove/clear image before submission
- ✅ Loading state during upload

## Image URL Format

After upload, the image URL will be in the format:
```
https://<your-supabase-url>/storage/v1/object/public/product-images/product-<timestamp>-<random>.ext
```

This URL is automatically filled into the product form and saved to the database.

## File Structure

**New Files:**
- `/app/api/admin/upload-image/route.ts` - API route for image upload

**Modified Files:**
- `/app/admin/inventory/page.tsx` - Updated with file upload UI and handler

## Security Notes

- Uploads use Supabase service role (server-side only)
- File type validation on client and server
- File size limit: 5MB
- Unique filenames prevent collisions
- Only authenticated admin sessions can access this form
- Consider adding IP whitelisting or API key validation for production
