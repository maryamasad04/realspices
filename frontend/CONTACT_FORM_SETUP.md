# Contact Form Setup Guide

This guide explains how to set up the contact form functionality that saves submissions to the database.

## Prerequisites

- Supabase project set up and configured
- Environment variables configured in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Setup

1. **Create the contacts table** in your Supabase database by running the SQL script:
   ```sql
   -- Copy and paste the contents of database/contacts_schema.sql
   -- into your Supabase SQL Editor and run it
   ```

2. **Verify table creation**:
   - Go to your Supabase dashboard
   - Navigate to the Database → Tables section
   - You should see a `contacts` table with the following columns:
     - `id` (UUID, Primary Key)
     - `name` (VARCHAR, Required)
     - `email` (VARCHAR, Required)
     - `phone` (VARCHAR, Optional)
     - `subject` (VARCHAR, Required)
     - `message` (TEXT, Required)
     - `status` (VARCHAR, Default: 'new')
     - `created_at` (Timestamp)
     - `updated_at` (Timestamp)

## Features

### Contact Form Submission
- **Location**: `/contact`
- **Functionality**: 
  - Validates required fields (name, email, subject, message)
  - Sanitizes input data
  - Uses dual submission approach (API route + direct Supabase fallback)
  - Shows success/error messages
  - Resets form on successful submission

### Admin Contact Management
- **Location**: `/admin/contacts`
- **Functionality**:
  - View all contact form submissions
  - Filter by status (new, in_progress, resolved, closed)
  - Update submission status
  - View submission details and contact information
  - Summary statistics

## API Endpoints

### POST /api/contact
Submits a new contact form entry.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890", // optional
  "subject": "Product inquiry",
  "message": "I have a question about your saffron products..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "id": "uuid-here"
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

## File Structure

```
app/
├── contact/
│   └── page.tsx              # Contact form page
├── admin/
│   └── contacts/
│       └── page.tsx          # Admin contact management
└── api/
    └── contact/
        └── route.ts          # Contact form API endpoint

lib/
├── queryApi.ts               # Query form helper functions
└── supabaseClient.js         # Supabase client configuration

database/
└── contacts_schema.sql       # Database schema for contacts table
```

## Helper Functions

### `lib/queryApi.ts`

- `initializeContactsTable()` - Check if contacts table exists
- `submitContactForm(contactData)` - Submit contact form data
- `getContactSubmissions(status?)` - Fetch contact submissions (admin)
- `updateContactStatus(id, status)` - Update submission status (admin)

## Security & Permissions

The contacts table uses Row Level Security (RLS) with the following policies:

- **Public Insertion**: Anyone can submit contact forms
- **Authenticated Read**: Only authenticated users can view submissions
- **Authenticated Update**: Only authenticated users can update submission status

## Status Workflow

Contact submissions have the following statuses:

1. **new** - Initial status when form is submitted
2. **in_progress** - Admin has started working on the inquiry
3. **resolved** - Inquiry has been resolved/responded to
4. **closed** - Inquiry is closed (no further action needed)

## Troubleshooting

### Common Issues

1. **"Database table not found" error**:
   - Ensure you've run the `contacts_schema.sql` script in Supabase
   - Check that the table was created successfully

2. **"Permission denied" error**:
   - Verify your Supabase RLS policies are set up correctly
   - Check that your environment variables are configured

3. **API endpoint not working**:
   - Ensure the API route file exists at `app/api/contact/route.ts`
   - Check browser console for detailed error messages

### Debugging

Enable debugging by checking the browser console when submitting the contact form. The application will log:
- Form submission attempts
- API responses
- Supabase operations
- Error details

## Testing

To test the contact form:

1. Go to `/contact`
2. Fill out all required fields
3. Submit the form
4. Check for success message
5. Verify submission in Supabase dashboard or at `/admin/contacts`

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```