# Fix 406 (Not Acceptable) Errors for Images

## Problem Summary
Some images in the Supabase Storage are returning 406 errors because they were uploaded without proper `Content-Type` metadata. Browsers send `Accept` headers requesting specific image formats, and when Supabase can't match the content type, it returns a 406 error.

## Root Cause
- Images were uploaded without explicit `contentType: 'image/png'` parameter
- Supabase Storage couldn't properly negotiate content types with browsers
- Some images have missing or incorrect MIME type metadata

## Solutions Implemented

### 1. Fix Future Uploads ✅
**File: `lib/supabase-utils.ts`**
- Added `contentType: 'image/png'` to the upload function
- All new uploads will have proper metadata

### 2. Fix Existing Images 🔧
**Run this SQL script in your Supabase SQL Editor:**

```sql
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- Copy and paste the contents of scripts/006_fix_image_content_types.sql
-- Or run this directly:

UPDATE storage.objects
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{mimetype}',
  '"image/png"'
)
WHERE bucket_id = 'avatars'
  AND (
    metadata IS NULL 
    OR metadata->>'mimetype' IS NULL 
    OR metadata->>'mimetype' != 'image/png'
  );

UPDATE storage.objects
SET metadata = jsonb_set(
  metadata,
  '{contentType}',
  '"image/png"'
)
WHERE bucket_id = 'avatars'
  AND (
    metadata->>'contentType' IS NULL 
    OR metadata->>'contentType' != 'image/png'
  );

-- Verify the fix
SELECT 
  COUNT(*) as total_images,
  COUNT(CASE WHEN metadata->>'mimetype' = 'image/png' THEN 1 END) as correct_mimetype,
  COUNT(CASE WHEN metadata->>'contentType' = 'image/png' THEN 1 END) as correct_contenttype
FROM storage.objects
WHERE bucket_id = 'avatars';
```

### 3. Enhanced Error Handling ✅
**File: `components/celebration-wall.tsx`**
- Added `onError` handler to retry loading images with cache busting
- Falls back to placeholder if image still fails

### 4. Improved Next.js Configuration ✅
**File: `next.config.mjs`**
- Added `remotePatterns` for Supabase and unavatar.io
- Added CORS headers for better cross-origin handling

## How to Apply the Fix

### Step 1: Run the SQL Migration
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `scripts/006_fix_image_content_types.sql`
5. Run the query
6. Check the verification output to confirm all images are fixed

### Step 2: Clear Browser Cache
After running the SQL script, users should clear their browser cache or do a hard refresh:
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

### Step 3: Verify the Fix
1. Visit your wall page: `https://your-domain.com/wall`
2. All images should now load properly
3. Check the browser console (F12) - you should see no more 406 errors

## Alternative: TypeScript Script (If SQL Doesn't Work)
If you prefer to use the TypeScript approach or if the SQL doesn't work:

```bash
# Install tsx if you don't have it
npm install -D tsx

# Run the fix script
npx tsx scripts/fix-image-metadata.ts
```

## Why This Happened

1. **Missing Content-Type on Upload**: The original upload code didn't specify `contentType`
2. **Browser Content Negotiation**: Modern browsers request images with Accept headers like:
   ```
   Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8
   ```
3. **406 Response**: When Supabase Storage doesn't have proper content-type metadata, it can't satisfy the Accept header and returns 406

## How the Fix Works

1. **SQL Update**: Directly updates the metadata in Supabase's `storage.objects` table
2. **New Uploads**: All future uploads explicitly set `contentType: 'image/png'`
3. **Error Recovery**: Client-side error handler retries with cache busting
4. **CORS Headers**: Next.js config ensures proper cross-origin handling

## Testing

After applying the fix, test with:
```bash
# Check a specific image URL
curl -I "https://your-project.supabase.co/storage/v1/object/public/avatars/your-image.png"

# Look for:
# HTTP/2 200 OK
# content-type: image/png
```

## Expected Results

- ✅ All 90+ images should load on the wall
- ✅ No more dark spots/missing tiles
- ✅ No 406 errors in browser console
- ✅ Downloads continue to work properly

## Need Help?

If images still don't load after applying all fixes:

1. Check Supabase Storage logs (Dashboard → Storage → Logs)
2. Verify RLS policies are correct (scripts/002_create_storage_bucket.sql)
3. Check browser console for specific error messages
4. Verify the public URL pattern matches your Supabase project URL

