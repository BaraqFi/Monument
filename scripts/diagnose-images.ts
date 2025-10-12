/**
 * Diagnostic tool to check which images have issues
 * 
 * Run with: npx tsx scripts/diagnose-images.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseImages() {
  console.log('🔍 Diagnosing image issues...\n')
  
  try {
    // Get all participants
    const { data: participants, error: dbError } = await supabase
      .from('participants')
      .select('id, x_handle, avatar_filename')
      .order('created_at', { ascending: true })

    if (dbError || !participants) {
      console.error('❌ Error fetching participants:', dbError)
      return
    }

    console.log(`📊 Total participants: ${participants.length}\n`)

    // Get all files from storage
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 10000 })

    if (listError || !files) {
      console.error('❌ Error listing storage files:', listError)
      return
    }

    console.log(`📦 Total files in storage: ${files.length}\n`)

    // Check each participant's image
    const issues: Array<{
      handle: string
      filename: string
      issue: string
    }> = []

    let workingImages = 0

    for (const participant of participants) {
      const fileInStorage = files.find(f => f.name === participant.avatar_filename)
      
      if (!fileInStorage) {
        issues.push({
          handle: participant.x_handle,
          filename: participant.avatar_filename,
          issue: 'File not found in storage'
        })
        continue
      }

      // Check metadata
      const metadata = fileInStorage.metadata as any
      const hasCorrectMimetype = metadata?.mimetype === 'image/png'
      const hasCorrectContentType = metadata?.contentType === 'image/png'

      if (!hasCorrectMimetype || !hasCorrectContentType) {
        issues.push({
          handle: participant.x_handle,
          filename: participant.avatar_filename,
          issue: `Missing/incorrect metadata (mimetype: ${metadata?.mimetype}, contentType: ${metadata?.contentType})`
        })
      } else {
        workingImages++
      }

      // Try to fetch the image
      const publicUrl = supabase.storage
        .from('avatars')
        .getPublicUrl(participant.avatar_filename)

      try {
        const response = await fetch(publicUrl.data.publicUrl, { method: 'HEAD' })
        if (!response.ok) {
          issues.push({
            handle: participant.x_handle,
            filename: participant.avatar_filename,
            issue: `HTTP ${response.status} ${response.statusText}`
          })
        }
      } catch (fetchError) {
        issues.push({
          handle: participant.x_handle,
          filename: participant.avatar_filename,
          issue: `Fetch error: ${fetchError}`
        })
      }
    }

    // Report results
    console.log('\n📈 RESULTS:')
    console.log(`✅ Working images: ${workingImages}`)
    console.log(`❌ Images with issues: ${issues.length}\n`)

    if (issues.length > 0) {
      console.log('⚠️  PROBLEMATIC IMAGES:\n')
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. @${issue.handle}`)
        console.log(`   File: ${issue.filename}`)
        console.log(`   Issue: ${issue.issue}\n`)
      })

      console.log('\n💡 RECOMMENDED ACTIONS:')
      console.log('1. Run the SQL migration: scripts/006_fix_image_content_types.sql')
      console.log('2. For missing files, users may need to re-upload')
      console.log('3. Check Supabase Storage permissions')
    } else {
      console.log('✨ All images look good!')
    }

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

// Run the diagnostic
diagnoseImages()

