# Supabase Email Configuration for Password Reset

## Problem
Emails are not being sent for password reset even though the code is correct.

## Solution
Supabase needs to be configured to send emails. There are two approaches:

### Option 1: Use Supabase's Default Email Provider (Recommended for Development)

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project: **biktkuoypnrdcvebcpbg**

2. **Configure Email Settings**
   - Go to **Authentication** → **Email Templates**
   - You should see pre-made templates including "Confirm email change"
   - These templates are already set up with Supabase's built-in email provider

3. **Set Redirect URLs**
   - Go to **Authentication** → **URL Configuration**
   - Under "Redirect URLs", add:
     ```
     http://localhost:3000/reset-password
     http://localhost:3000/auth/callback
     https://yourdomain.com/reset-password
     ```
   - Click "Save"

4. **Verify Auth Settings**
   - Go to **Authentication** → **Providers** → **Email**
   - Ensure "Email" is enabled (toggle should be ON)
   - Check "Autoconfirm" setting:
     - For development/testing: You may want to DISABLE "Autoconfirm" so you get the confirmation flow
     - For production: Configure as needed

### Option 2: Use SendGrid (For Production)

If Supabase's default provider doesn't work or you need custom branding:

1. **Get SendGrid API Key**
   - Sign up at: https://sendgrid.com
   - Get your API key from Settings → API Keys

2. **Add to Environment Variables**
   - Create `.env.local` file with:
     ```
     SENDGRID_API_KEY=your_sendgrid_api_key
     SUPPORT_EMAIL=noreply@realspices.com
     ```

3. **Update Supabase Settings**
   - Go to **Project Settings** → **Auth** → **Email**
   - Enable "Custom SMTP"
   - Enter SendGrid SMTP details (available in SendGrid docs)

## Testing the Setup

### Step 1: Check Supabase Console
1. Go to your Supabase dashboard
2. Click on **Authentication** → **Users**
3. Create a test user if you don't have one

### Step 2: Request Password Reset
1. Go to: `http://localhost:3000/forgot-password`
2. Enter a test email address
3. Should see success message: "Check Your Email"

### Step 3: Check Email Delivery
- **Option A: Real Email**
  - Check your inbox/spam folder
  - Look for email from Supabase
  
- **Option B: Supabase Email Log (Dev Mode)**
  1. Go to Supabase Dashboard
  2. Click **Authentication** → **Logs**
  3. Look for email sending attempts
  4. Check for any error messages

### Step 4: Check Reset Link
- If email received, click the reset link
- Should redirect to: `http://localhost:3000/reset-password?token=...`
- Form should appear (not an error)

## Troubleshooting

### Email Not Received
**Cause**: Email provider not configured

**Solution**:
1. Verify email is enabled in Supabase Auth settings
2. Check Supabase logs for errors
3. If using SendGrid, verify API key is correct
4. Try a different email address

### Error: "Invalid or expired reset link"
**Cause**: Redirect URL not configured or session not persisting

**Solution**:
1. Add exact redirect URLs in Supabase settings
2. Ensure `detectSessionInUrl: true` is in supabaseClient.ts
3. Clear browser cookies and try again
4. Check that session is being created

### Email Sends but Link Doesn't Work
**Cause**: Redirect URL not in Supabase whitelist

**Solution**:
1. Go to **Authentication** → **URL Configuration**
2. Add your exact domain: `http://localhost:3000/reset-password`
3. Add production domain: `https://yourdomain.com/reset-password`
4. Save and wait 2-3 minutes
5. Try again

## Supabase Email Limits

- **Default Provider**: Limited sends per day in free tier
- **SendGrid**: Much higher limits
- Check your Supabase plan at: https://app.supabase.com/project/biktkuoypnrdcvebcpbg/settings/billing

## Email Template Customization

To customize the password reset email template:

1. Go to **Authentication** → **Email Templates**
2. Find "Confirm email change" template
3. Click **Edit**
4. Customize the subject and body
5. Use these variables:
   - `{{ .ConfirmationURL }}` - The reset link
   - `{{ .Email }}` - User's email

## Quick Checklist

- [ ] Supabase project created
- [ ] Email provider enabled in Auth settings
- [ ] Redirect URLs configured in URL Configuration
- [ ] `.env.local` has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] `supabaseClient.ts` has `detectSessionInUrl: true`
- [ ] Tested forgot password flow
- [ ] Checked inbox and spam folder
- [ ] Checked Supabase logs for errors

## Next Steps

If emails still don't work after following this guide:

1. **Check Supabase Status**: Is your project active and not paused?
2. **Check Quotas**: Have you exceeded email limits?
3. **Test with Supabase CLI**: Run `supabase functions deploy` to test the function
4. **Open Support Ticket**: Contact Supabase support with your project ID

## Production Deployment

For production, consider:

1. **Use SendGrid** for better deliverability
2. **Custom domain emails** (e.g., noreply@yourdomain.com)
3. **Monitor email delivery** using SendGrid dashboard
4. **Set up email bounce handling**
5. **Test with real email services** (Gmail, Outlook, etc.)
