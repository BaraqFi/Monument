-- Fix Content-Type metadata for all existing images in the avatars bucket
-- This resolves 406 (Not Acceptable) errors when browsers request images

-- Update all images in the avatars bucket to have the correct content-type
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

-- Also set the content-type in the HTTP headers
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

-- Verify the changes
SELECT 
  COUNT(*) as total_images,
  COUNT(CASE WHEN metadata->>'mimetype' = 'image/png' THEN 1 END) as correct_mimetype,
  COUNT(CASE WHEN metadata->>'contentType' = 'image/png' THEN 1 END) as correct_contenttype
FROM storage.objects
WHERE bucket_id = 'avatars';

