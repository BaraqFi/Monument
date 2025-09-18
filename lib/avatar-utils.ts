/**
 * Avatar utility functions for handling both Supabase storage and unavatar.io
 */

import { getAvatarUrl } from "./supabase-utils"

/**
 * Generate unavatar.io URL for a given X handle
 * @param handle - X/Twitter handle (with or without @)
 * @param size - Image size (default: 400)
 * @returns unavatar.io URL
 */
export function getUnavatarUrl(handle: string, size: number = 400): string {
  // Remove @ if present
  const cleanHandle = handle.replace(/^@/, '')
  return `https://unavatar.io/x/${cleanHandle}?size=${size}`
}

/**
 * Get avatar URL with fallback strategy
 * @param participant - Participant object
 * @param useUnavatar - Whether to use unavatar for display (default: false for grid tiles)
 * @param size - Size for unavatar (default: 400)
 * @returns Avatar URL
 */
export function getAvatarUrlWithFallback(
  participant: { x_handle: string; avatar_filename: string },
  useUnavatar: boolean = false,
  size: number = 400
): string {
  if (useUnavatar && participant.x_handle) {
    // Use unavatar for modal display
    return getUnavatarUrl(participant.x_handle, size)
  }
  
  // Use Supabase storage for grid tiles
  return getAvatarUrl(participant.avatar_filename)
}

/**
 * Check if unavatar is available for a given handle
 * This can be used for preloading or validation
 */
export async function checkUnavatarAvailability(handle: string): Promise<boolean> {
  try {
    const url = getUnavatarUrl(handle, 100) // Small size for quick check
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Preload unavatar image for better UX
 */
export function preloadUnavatar(handle: string, size: number = 400): void {
  const img = new Image()
  img.src = getUnavatarUrl(handle, size)
}
