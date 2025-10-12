/**
 * Script to fix Content-Type metadata for existing images in Supabase Storage
 * 
 * This fixes 406 errors by ensuring all images have proper Content-Type headers
 * 
 * Run with: npx tsx scripts/fix-image-metadata.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixImageMetadata() {
  console.log('🔍 Fetching all images from avatars bucket...')
  
  try {
    // List all files in the avatars bucket
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list('', {
        limit: 10000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return
    }

    console.log(`📦 Found ${files.length} images`)

    let fixed = 0
    let errors = 0

    // Process each file
    for (const file of files) {
      try {
        // Download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('avatars')
          .download(file.name)

        if (downloadError) {
          console.error(`❌ Error downloading ${file.name}:`, downloadError)
          errors++
          continue
        }

        // Delete the old file
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([file.name])

        if (deleteError) {
          console.error(`❌ Error deleting ${file.name}:`, deleteError)
          errors++
          continue
        }

        // Re-upload with correct content type
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(file.name, fileData, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error(`❌ Error re-uploading ${file.name}:`, uploadError)
          errors++
          continue
        }

        fixed++
        if (fixed % 10 === 0) {
          console.log(`✅ Progress: ${fixed}/${files.length} images fixed`)
        }

      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error)
        errors++
      }
    }

    console.log('\n✨ Done!')
    console.log(`✅ Fixed: ${fixed} images`)
    console.log(`❌ Errors: ${errors} images`)

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

// Run the script
fixImageMetadata()

