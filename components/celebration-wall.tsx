"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getAvatarUrl } from "@/lib/supabase-utils"
import { getAvatarUrlWithFallback } from "@/lib/avatar-utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { Participant } from "@/lib/types"
import confetti from "canvas-confetti"
import { useIsMobile } from "@/hooks/use-mobile"

interface CelebrationWallProps {
  onSecretDoor: () => void
  onBackFromSecret?: () => void
}

export function CelebrationWall({ onSecretDoor, onBackFromSecret }: CelebrationWallProps) {
  const isMobile = useIsMobile()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [userParticipant, setUserParticipant] = useState<Participant | null>(null)
  const [showTweetButton, setShowTweetButton] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<Participant[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [selectedImage, setSelectedImage] = useState<Participant | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [userHandle, setUserHandle] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Responsive grid configuration
  const MOBILE_TILES_PER_PAGE = 400 // 20x20 grid for mobile (square)
  const DESKTOP_TILES_PER_PAGE = 400 // 25x16 grid for desktop (wide)
  const TILES_PER_PAGE = isMobile ? MOBILE_TILES_PER_PAGE : DESKTOP_TILES_PER_PAGE
  
  const MOBILE_GRID_COLUMNS = 20
  const MOBILE_GRID_ROWS = 20
  const DESKTOP_GRID_COLUMNS = 25
  const DESKTOP_GRID_ROWS = 16
  
  const GRID_COLUMNS = isMobile ? MOBILE_GRID_COLUMNS : DESKTOP_GRID_COLUMNS
  const GRID_ROWS = isMobile ? MOBILE_GRID_ROWS : DESKTOP_GRID_ROWS
  
  const TOTAL_PAGES = Math.ceil(10000 / TILES_PER_PAGE) // Dynamic based on tiles per page

  // Reset to first page when switching between mobile/desktop
  useEffect(() => {
    setCurrentPage(0)
    setLoadedImages(new Set())
  }, [isMobile])

  useEffect(() => {
    // Get user handle from localStorage
    const storedHandle = localStorage.getItem("monument_user_handle")
    setUserHandle(storedHandle)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const loadParticipants = async () => {
      // Only select necessary fields for performance
      const { data, error } = await supabase
        .from("participants")
        .select("id, x_handle, avatar_filename, created_at")
        .order("created_at", { ascending: true })

      if (data && !error) {
        setParticipants(data)

        if (userHandle) {
          const userRecord = data.find((p) => p.x_handle.toLowerCase() === userHandle.toLowerCase())
          setUserParticipant(userRecord || null)
        }
      }
    }

    loadParticipants()

    // Set up real-time subscription with throttling (optional - works without it)
    const channel = supabase
      .channel("participants_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
        },
        (payload) => {
          const newParticipant = payload.new as Participant
          setPendingUpdates((prev) => [...prev, newParticipant])
        },
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.log('Realtime subscription status:', status)
        }
      })

    // Throttle realtime updates into batches
    const updateInterval = setInterval(() => {
      setPendingUpdates((pending) => {
        if (pending.length > 0) {
          setParticipants((prev) => [...prev, ...pending])
          
          // Check if any pending updates are for current user
          const userUpdate = pending.find((p) => userHandle && p.x_handle.toLowerCase() === userHandle.toLowerCase())
          if (userUpdate) {
            setUserParticipant(userUpdate)
          }
          
          return [] // Clear pending updates
        }
        return pending
      })
    }, 500) // Batch updates every 500ms

    // Fallback: poll for new participants every 10 seconds if realtime fails
    const pollInterval = setInterval(() => {
      loadParticipants()
    }, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(updateInterval)
      clearInterval(pollInterval)
    }
  }, [userHandle])

  // Handle first-time confetti and tweet button
  useEffect(() => {
    if (userParticipant && userHandle) {
      const hasSeenConfetti = localStorage.getItem(`confetti_${userHandle}`)

      if (!hasSeenConfetti) {
        // Defer confetti until after first paint
        requestAnimationFrame(() => {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          }, 100)
        })

        // Show tweet button
        setShowTweetButton(true)

        // Mark as seen
        localStorage.setItem(`confetti_${userHandle}`, "true")
      }
    }
  }, [userParticipant, userHandle])

  const handleTweet = () => {
    const tweetText = `I just placed my tile in the Monument! 🎨 Join the celebration at ${window.location.origin}`
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(tweetUrl, "_blank")
    setShowTweetButton(false)
  }

  const handleDownloadCollage = async () => {
    if (isDownloading) return
    
    setIsDownloading(true)
    
    try {
      const startIndex = currentPage * TILES_PER_PAGE
      
      // Tile size for high quality output
      const TILE_SIZE = 120 // pixels per tile in output
      const canvasWidth = GRID_COLUMNS * TILE_SIZE
      const canvasHeight = GRID_ROWS * TILE_SIZE
      
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }
      
      // Fill background
      ctx.fillStyle = '#200152'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      // Load and draw all images
      const imagePromises: Promise<void>[] = []
      
      for (let i = 0; i < TILES_PER_PAGE; i++) {
        const globalIndex = startIndex + i
        const participant = participants[globalIndex]
        
        const row = Math.floor(i / GRID_COLUMNS)
        const col = i % GRID_COLUMNS
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE
        
        if (participant) {
          // Create promise to load and draw participant avatar
          const promise = new Promise<void>((resolve) => {
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            
            img.onload = () => {
              ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE)
              resolve()
            }
            
            img.onerror = () => {
              // Draw placeholder on error
              ctx.fillStyle = '#937cdf20'
              ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
              resolve()
            }
            
            img.src = getAvatarUrl(participant.avatar_filename) || '/placeholder.svg'
          })
          
          imagePromises.push(promise)
        } else {
          // Draw empty tile
          ctx.fillStyle = '#937cdf20'
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        }
      }
      
      // Wait for all images to load
      await Promise.all(imagePromises)
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `monument-page-${currentPage + 1}-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        setIsDownloading(false)
      }, 'image/png', 1.0)
      
    } catch (error) {
      console.error('Error downloading collage:', error)
      setIsDownloading(false)
    }
  }

  const renderMuralGrid = () => {
    const startIndex = currentPage * TILES_PER_PAGE
    const endIndex = startIndex + TILES_PER_PAGE
    const tiles = []

    // Create grid for current page (400 tiles: 25x16 desktop, 20x20 mobile)
    for (let i = 0; i < TILES_PER_PAGE; i++) {
      const globalIndex = startIndex + i
      const participant = participants[globalIndex]
      const isUserTile = participant && userParticipant && participant.id === userParticipant.id
      const shouldLoadImage = loadedImages.has(globalIndex) || i < 400 // Load all tiles on current page immediately

      tiles.push(
        <div
          key={globalIndex}
          ref={(node) => imageRef(node, globalIndex)}
          className={`flex items-center justify-center relative transition-opacity ${
            !isMobile ? "cursor-pointer hover:opacity-90" : ""
          } ${isUserTile ? "ring-2 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60" : ""}`}
          style={{ 
            backgroundColor: participant ? "transparent" : "#937cdf20",
            width: "100%",
            height: "100%",
            margin: "0",
            padding: "0",
            border: "none",
            outline: "none",
            lineHeight: "0",
            fontSize: "0"
          }}
          onClick={() => !isMobile && participant && setSelectedImage(participant)}
        >
          {participant && shouldLoadImage ? (
            <Image
              src={getAvatarUrl(participant.avatar_filename) || "/placeholder.svg"}
              alt={`${participant.x_handle}'s avatar`}
              width={isMobile ? 60 : 80} // Responsive tile sizes
              height={isMobile ? 60 : 80} // Mobile: 60px, Desktop: 80px
              className="w-full h-full object-cover"
              style={{ display: 'block', margin: 0, padding: 0 }}
              onError={(e) => {
                // Fallback for broken images - try adding cache buster
                const target = e.target as HTMLImageElement
                const currentSrc = target.src
                if (!currentSrc.includes('?t=')) {
                  target.src = `${getAvatarUrl(participant.avatar_filename)}?t=${Date.now()}`
                } else {
                  // If cache buster didn't work, show placeholder
                  target.src = '/placeholder.svg'
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-purple-800/30" style={{ margin: 0, padding: 0, display: 'block' }} />
          )}

          {isUserTile && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />}
        </div>,
      )
    }

    return (
      <div
        ref={gridRef}
        className="grid transition-transform duration-500 ease-in-out"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          gap: "0",
          margin: "0",
          padding: "0",
          width: isMobile ? "95vw" : "85vw", // More space on mobile
          height: "auto",
          maxWidth: isMobile ? "95vw" : "85vw",
          aspectRatio: isMobile ? "1/1" : "25/16", // Square on mobile, wider on desktop
          lineHeight: "0",
          fontSize: "0",
        }}
      >
        {tiles}
      </div>
    )
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1)
      setLoadedImages(new Set()) // Reset loaded images for new page
    } else if (direction === 'next' && currentPage < TOTAL_PAGES - 1) {
      setCurrentPage(currentPage + 1)
      setLoadedImages(new Set()) // Reset loaded images for new page
    }
  }

  // Intersection observer for lazy loading images
  const imageRef = useCallback((node: HTMLDivElement | null, index: number) => {
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadedImages(prev => new Set([...prev, index]))
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    
    if (node) observerRef.current.observe(node)
  }, [])

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#200152" }}>
      {/* Doodle Strip - restored */}
      <div className="w-full">
        <Image
          src="/doodle-strip.jpeg"
          alt="Doodle Strip"
          width={1200}
          height={120}
          className="w-full h-24 object-cover"
        />
      </div>

      {/* Header with controls */}
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">{participants.length} / 10000 placed</h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg font-semibold transition-opacity ${
                currentPage === 0 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:opacity-90'
              }`}
            >
              ← Previous
            </button>
            <span className="text-white text-lg">
              Page {currentPage + 1} of {TOTAL_PAGES}
            </span>
            <button
              onClick={() => handlePageChange('next')}
              disabled={currentPage === TOTAL_PAGES - 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-opacity ${
                currentPage === TOTAL_PAGES - 1 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:opacity-90'
              }`}
            >
              Next →
            </button>
          </div>
          
          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownloadCollage}
              disabled={isDownloading}
              className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isDownloading 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
              }`}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Capturing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Page {currentPage + 1}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Grid container with proper spacing */}
        <div className="w-full flex justify-center">
          {renderMuralGrid()}
        </div>

        {showTweetButton && (
          <div className="text-center mt-6">
            <Button
              onClick={handleTweet}
              className="text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#937cdf" }}
            >
              Tweet my tile 🐦
            </Button>
          </div>
        )}
      </div>

      {/* Secret door - fixed position */}
      <div className="fixed bottom-4 right-4 z-10">
        <button
          onClick={() => {
            // Store user interaction for video audio playback
            localStorage.setItem("monument_user_interacted", "true")
            onSecretDoor()
          }}
          className="text-2xl hover:scale-110 transition-transform duration-300 animate-pulse"
          title="Secret door"
        >
          🚪
        </button>
      </div>

      {/* Image Modal - Desktop Only */}
      {selectedImage && !isMobile && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[70vh] rounded-lg overflow-hidden shadow-2xl flex flex-col"
            style={{ backgroundColor: "#200152" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#937cdf40" }}>
              <div>
                <h1 className="text-2xl font-bold text-white">@{selectedImage.x_handle}</h1>
                <p className="text-white/70">Monument Participant</p>
                <p className="text-xs text-green-400/80 mt-1">🔄 Live X avatar</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Image */}
              <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: "#937cdf20" }}>
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={getAvatarUrlWithFallback(selectedImage, true, 450)}
                    alt={`${selectedImage.x_handle}'s avatar`}
                    width={450}
                    height={450}
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                    unoptimized={true}
                    priority={true}
                    onError={(e) => {
                      // Fallback to Supabase storage if unavatar fails
                      const target = e.target as HTMLImageElement
                      target.src = getAvatarUrl(selectedImage.avatar_filename)
                    }}
                  />
                </div>
              </div>

              {/* Right Panel - Details */}
              <div className="w-80 p-6 overflow-y-auto border-l" style={{ backgroundColor: "#200152", borderColor: "#937cdf40" }}>
                <div className="space-y-6">
                  {/* User Info */}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Participant Details</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Username:</span>
                        <span className="text-white font-medium">@{selectedImage.x_handle}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Position:</span>
                        <span className="text-white font-mono text-sm">#{participants.findIndex(p => p.id === selectedImage.id) + 1} / 10,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Joined:</span>
                        <span className="text-white">
                          {new Date(selectedImage.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Monument Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Total Participants:</span>
                        <span className="text-white">{participants.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Completion:</span>
                        <span className="text-white">{((participants.length / 10000) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
