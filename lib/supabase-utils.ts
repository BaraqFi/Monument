import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding"
import { createClient } from "./supabase/client"
import type { Participant } from "./types"

export async function checkUsernameAvailable(xHandle: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.from("participants").select("id").ilike("x_handle", xHandle).single()

  // If error (not found), username is available
  return !!error
}

export async function createParticipant(
  xHandle: string,
  avatarFilename: string,
): Promise<Participant | null> {
  const supabase = createClient()

  // Double-check username availability before insert
  const isAvailable = await checkUsernameAvailable(xHandle)
  if (!isAvailable) {
    throw new Error("User already exists")
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({
      x_handle: xHandle,
      avatar_filename: avatarFilename,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating participant:", error)
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("User already exists")
    }
    return null
  }

  return data
}

export async function uploadAvatar(file: File, filename: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from("avatars").upload(filename, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/png", // Explicitly set content type
  })

  if (error) {
    console.error("Error uploading avatar:", error)
    return null
  }

  return data.path
}

export function getAvatarUrl(filename: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from("avatars").getPublicUrl(filename)
  console.log(`URL for ${filename}:`, data.publicUrl)

  return data.publicUrl
}
