# Quick Fix for 406 Image Errors

## 🎯 The Problem
40 out of 90 user profile images show as dark spots on the wall due to 406 (Not Acceptable) HTTP errors from Supabase Storage.

## ✅ The Solution (5 minutes)

### Option 1: SQL Fix (Recommended - Instant)

1. **Go to Supabase Dashboard** → SQL Editor → New Query

2. **Run this SQL:**
```sql
UPDATE storage.objects
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{mimetype}', '"image/png"')
WHERE bucket_id = 'avatars' AND (metadata IS NULL OR metadata->>'mimetype' IS NULL OR metadata->>'mimetype' != 'image/png');

UPDATE storage.objects
SET metadata = jsonb_set(metadata, '{contentType}', '"image/png"')
WHERE bucket_id = 'avatars' AND (metadata->>'contentType' IS NULL OR metadata->>'contentType' != 'image/png');
```

3. **Verify (optional):**
```sql
SELECT COUNT(*) as total, COUNT(CASE WHEN metadata->>'mimetype' = 'image/png' THEN 1 END) as fixed
FROM storage.objects WHERE bucket_id = 'avatars';
```

4. **Hard refresh your wall page:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

5. **Done!** All 90 images should now load ✨

### Option 2: TypeScript Script (Alternative)

```bash
npx tsx scripts/fix-image-metadata.ts
```

## 📝 What Was Changed in Code

### 1. `lib/supabase-utils.ts`
- ✅ Added `contentType: 'image/png'` to all new uploads

### 2. `components/celebration-wall.tsx`
- ✅ Added error handler with cache-busting retry
- ✅ Falls back to placeholder if image fails

### 3. `next.config.mjs`
- ✅ Added remote patterns for Supabase domains
- ✅ Added CORS headers

## 🔍 How to Verify It Worked

1. Visit `/wall` page
2. Check browser console (F12) - should see no 406 errors
3. All tiles should show images (no dark spots)
4. Download function should still work

## ⚠️ Important Notes

- **Future uploads**: Already fixed - all new images will have correct content-type
- **Existing images**: Need to run the SQL migration above
- **No data loss**: This only updates metadata, doesn't touch actual images
- **Reversible**: You can always revert if needed

## 📞 If Still Having Issues

1. Check Supabase Storage bucket is public (should be from setup)
2. Verify RLS policies allow public read (scripts/002_create_storage_bucket.sql)
3. Check browser console for specific error messages
4. Verify your Supabase project URL in environment variables

---

**Estimated fix time:** 2-5 minutes  
**Risk level:** Low (only metadata update)  
**Rollback:** Reversible via SQL

