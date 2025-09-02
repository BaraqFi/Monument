import { createClient } from "./supabase/client"
import type { Participant } from "./types"
import { hasJoinedContract } from "./contract"

// Cache for recent participant checks to reduce database calls
const participantCache = new Map<string, { data: Participant | null; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export async function checkExistingParticipant(walletAddress: string): Promise<Participant | null> {
  // Check cache first
  const cached = participantCache.get(walletAddress)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  // Check contract participation first
  const hasJoined = await hasJoinedContract(walletAddress)
  if (!hasJoined) {
    // Cache negative result
    participantCache.set(walletAddress, { data: null, timestamp: Date.now() })
    return null
  }

  // If joined on contract, get additional data from Supabase
  const supabase = createClient()
  const { data, error } = await supabase.from("participants").select("*").eq("wallet_address", walletAddress).single()

  const result = error ? null : data

  // Cache the result
  participantCache.set(walletAddress, { data: result, timestamp: Date.now() })

  return result
}

export async function checkUsernameAvailable(xHandle: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.from("participants").select("id").ilike("x_handle", xHandle).single()

  // If error (not found), username is available
  return !!error
}

export async function createParticipant(
  walletAddress: string,
  xHandle: string,
  avatarFilename: string,
): Promise<Participant | null> {
  // Contract call is handled separately in the component
  // This function now only stores additional data in Supabase
  const supabase = createClient()

  // Double-check username availability before insert
  const isAvailable = await checkUsernameAvailable(xHandle)
  if (!isAvailable) {
    throw new Error("User already exists")
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({
      wallet_address: walletAddress,
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

  // Clear cache for this wallet
  participantCache.delete(walletAddress)

  return data
}

export async function uploadAvatar(file: File, filename: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from("avatars").upload(filename, file, {
    cacheControl: "3600",
    upsert: false,
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

  return data.publicUrl
}
