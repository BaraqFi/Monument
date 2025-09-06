"use client"

import React, { useState, useCallback } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createParticipant, uploadAvatar, checkUsernameAvailable } from "@/lib/supabase-utils"
import { joinMonumentContract } from "@/lib/contract"
import { useToast } from "@/hooks/use-toast"
import NextImage from "next/image"

interface HandleAvatarPageProps {
  onComplete: () => void
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function HandleAvatarPage({ onComplete }: HandleAvatarPageProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  const [handle, setHandle] = useState("")
  const [showUpload, setShowUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const debouncedHandle = useDebounce(handle.trim(), 500)

  // Check username availability
  React.useEffect(() => {
    if (debouncedHandle && debouncedHandle.length > 0) {
      setIsCheckingUsername(true)
      checkUsernameAvailable(debouncedHandle)
        .then(setUsernameAvailable)
        .catch(() => setUsernameAvailable(false))
        .finally(() => setIsCheckingUsername(false))
    } else {
      setUsernameAvailable(null)
    }
  }, [debouncedHandle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handle.trim() || !address || usernameAvailable === false) return

    try {
      toast({
        title: "Joining Monument...",
        description: "Please confirm the transaction in your wallet",
      })

      const txHash = await joinMonumentContract(handle.trim(), address as `0x${string}`)

      toast({
        title: "Transaction submitted",
        description: "Waiting for confirmation...",
      })

      // Wait for actual blockchain confirmation
      const { publicClient } = await import("@/lib/contract")
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60000 // 60 second timeout
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed')
      }

      toast({
        title: "Transaction confirmed!",
        description: "Your join is now on-chain",
      })

      setShowUpload(true)
    } catch (error: any) {
      console.error("Contract call failed:", error)
      toast({
        title: "Transaction failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!address || !handle.trim() || usernameAvailable === false) return

      // Upload validation
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please choose a JPEG, PNG, WebP, or GIF image",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)

      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        img.onload = async () => {
          canvas.width = 64
          canvas.height = 64

          // Better image scaling
          if (ctx) {
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.drawImage(img, 0, 0, 64, 64)
          }

          canvas.toBlob(
            async (blob) => {
              if (!blob) return

              const filename = `${address}-${Date.now()}.png`
              const resizedFile = new File([blob], filename, { type: "image/png" })

              toast({
                title: "Stamping your tile...",
                description: "Processing your avatar",
              })

              try {
                // Upload to Supabase storage
                const uploadPath = await uploadAvatar(resizedFile, filename)

                if (uploadPath) {
                  const participant = await createParticipant(address, handle.trim(), filename)

                  if (participant) {
                    toast({
                      title: "Tile stamped!",
                      description: "Welcome to the Monument",
                    })

                    setTimeout(() => {
                      onComplete()
                    }, 1000)
                  }
                }
              } catch (error: any) {
                if (error.message === "User already exists") {
                  toast({
                    title: "User already exists",
                    description: "Please choose a different username",
                    variant: "destructive",
                  })
                  setUsernameAvailable(false)
                } else {
                  throw error
                }
              }
            },
            "image/png",
            0.9,
          )
        }

        img.src = URL.createObjectURL(file)
      } catch (error) {
        console.error("Upload failed:", error)
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [address, handle, usernameAvailable, onComplete, toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((file) => file.type.startsWith("image/"))

      if (imageFile) {
        handleFileUpload(imageFile)
      }
    },
    [handleFileUpload],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const getUsernameStatus = () => {
    if (!handle.trim()) return null
    if (isCheckingUsername) return { color: "text-yellow-400", text: "Checking..." }
    if (usernameAvailable === true) return { color: "text-green-400", text: "Available ✓" }
    if (usernameAvailable === false) return { color: "text-red-400", text: "User already exists ✗" }
    return null
  }

  const usernameStatus = getUsernameStatus()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#200152" }}>
      <div className="w-full">
        <NextImage
          src="/doodle-strip.jpeg"
          alt="Doodle Strip"
          width={1200}
          height={120}
          className="w-full h-16 sm:h-20 md:h-24 object-cover"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
          {/* Handle Input */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="ENTER USERNAME"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                maxLength={20}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-white/90 border-2 rounded-lg text-center text-base sm:text-lg font-semibold tracking-wider"
                style={{
                  backgroundColor: "#937cdf",
                  borderColor: "#937cdf",
                }}
                required
              />
              {usernameStatus && <p className={`text-center text-sm ${usernameStatus.color}`}>{usernameStatus.text}</p>}
            </div>

            {!showUpload && (
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-32 sm:w-40 text-white font-semibold py-2 sm:py-3 rounded-lg text-base sm:text-lg hover:opacity-90 transition-opacity tracking-wider"
                  style={{ backgroundColor: "#937cdf" }}
                  disabled={!handle.trim() || usernameAvailable === false || isCheckingUsername}
                >
                  SUBMIT →
                </Button>
              </div>
            )}
          </form>

          {/* Upload Zone */}
          {showUpload && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                isDragOver ? "border-white bg-white/10" : "border-white/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="avatar-upload"
                disabled={isUploading}
              />

              <label htmlFor="avatar-upload" className="cursor-pointer text-white">
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm sm:text-base">Stamping your tile...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-base sm:text-lg">Drop your avatar here</p>
                    <p className="text-xs sm:text-sm text-white/70">or click to browse</p>
                  </div>
                )}
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
