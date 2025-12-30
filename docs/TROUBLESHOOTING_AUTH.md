# Troubleshooting Supabase Authentication in Production

## Issue: Sign In/Up buttons don't work in production

If clicking sign in or sign up buttons does nothing, check the following:

## 1. Check Environment Variables in Vercel

The most common issue is missing environment variables in production.

### Required Variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Your Supabase anon/publishable key
  - OR `NEXT_PUBLIC_SUPABASE_ANON_KEY` (alternative name, also supported)

### How to Check:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify both variables are set for **Production** environment
4. **Important**: After adding/updating variables, you must **redeploy** your project

### How to Get Values:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon public** key

## 2. Check Browser Console

Open your browser's developer console (F12) and look for:

1. **Red error messages** - These will now show detailed error messages about missing env vars
2. **Network tab** - Check if requests to Supabase are being made (they should fail if env vars are missing)

### What to Look For:

```
[Supabase Client] Environment variables missing: ...
```

If you see this, your environment variables are not set correctly in Vercel.

## 3. Check Supabase Redirect URLs

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Verify these URLs are in **Redirect URLs**:
   - `https://your-production-domain.vercel.app/auth/confirm`
   - `https://your-production-domain.vercel.app/**` (wildcard is allowed)
3. Verify **Site URL** is set to your production domain

## 4. Verify Build and Deployment

After setting environment variables in Vercel:

1. **Redeploy** your application (trigger a new deployment)
2. Environment variables are only available after a new build
3. Check the deployment logs to ensure the build succeeded

## 5. Test Locally First

To verify your environment variables work:

1. Create a `.env.local` file in `apps/frontend/`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key-here
   ```

2. Run the app locally:

   ```bash
   cd apps/frontend
   npm run dev
   ```

3. Test sign in/up locally - if it works locally but not in production, it's an environment variable issue

## 6. Common Mistakes

- ❌ Setting env vars only for Preview, not Production
- ❌ Forgetting to redeploy after adding env vars
- ❌ Using wrong variable name (should start with `NEXT_PUBLIC_`)
- ❌ Copying keys with extra spaces or newlines
- ❌ Using the service role key instead of anon key (never expose service role!)

## 7. Debugging Steps

The code now includes better error handling and logging:

1. **Check browser console** - You'll see detailed error messages
2. **Check Vercel deployment logs** - Look for any build-time errors
3. **Check Vercel function logs** - Look for runtime errors in middleware

## Quick Fix Checklist

- [ ] Environment variables set in Vercel for Production environment
- [ ] Redeployed after setting env vars
- [ ] Verified variables start with `NEXT_PUBLIC_`
- [ ] Checked browser console for error messages
- [ ] Verified Supabase redirect URLs include your production domain
- [ ] Tested locally with `.env.local` to confirm variables are correct

## Still Not Working?

If you've checked everything above and it still doesn't work:

1. Check the browser console error messages (they're now more detailed)
2. Share the error message you see in the console
3. Verify you can access your Supabase project URL directly
4. Check if your Supabase project is active (not paused)



