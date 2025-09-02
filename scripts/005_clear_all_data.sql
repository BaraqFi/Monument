-- Clear all participant data and uploaded avatars
-- This will reset the monument to a fresh state

-- Delete all participant records
DELETE FROM participants;

-- Reset the auto-increment counter (if using serial/identity columns)
-- Note: This is PostgreSQL syntax, adjust if using different database
ALTER SEQUENCE IF EXISTS participants_id_seq RESTART WITH 1;

-- Clear all files from the avatars storage bucket
-- Note: This requires running the following in Supabase dashboard or via API:
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Verify the cleanup
SELECT COUNT(*) as remaining_participants FROM participants;
