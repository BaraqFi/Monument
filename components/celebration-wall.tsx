"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAccount } from "wagmi"
import { createClient } from "@/lib/supabase/client"
import { getAvatarUrl } from "@/lib/supabase-utils"
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
  const { address } = useAccount()
  const isMobile = useIsMobile()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [userParticipant, setUserParticipant] = useState<Participant | null>(null)
  const [showTweetButton, setShowTweetButton] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<Participant[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [selectedImage, setSelectedImage] = useState<Participant | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  // Responsive grid configuration
  const MOBILE_TILES_PER_PAGE = 500 // 500 tiles per page for mobile (20 pages total)
  const DESKTOP_TILES_PER_PAGE = 1000 // 40x25 grid for desktop (10 pages max)
  const TILES_PER_PAGE = isMobile ? MOBILE_TILES_PER_PAGE : DESKTOP_TILES_PER_PAGE
  
  const MOBILE_GRID_COLUMNS = 10 // 10 columns for mobile
  const MOBILE_GRID_ROWS = 50 // 50 rows for mobile (10x50 = 500 tiles, scrollable)
  const DESKTOP_GRID_COLUMNS = 40
  const DESKTOP_GRID_ROWS = 25
  
  const GRID_COLUMNS = isMobile ? MOBILE_GRID_COLUMNS : DESKTOP_GRID_COLUMNS
  const GRID_ROWS = isMobile ? MOBILE_GRID_ROWS : DESKTOP_GRID_ROWS
  
  const TOTAL_PAGES = Math.ceil(10000 / TILES_PER_PAGE) // Dynamic based on tiles per page

  // Reset to first page when switching between mobile/desktop
  useEffect(() => {
    setCurrentPage(0)
    setLoadedImages(new Set())
  }, [isMobile])

  useEffect(() => {
    const supabase = createClient()

    const loadParticipants = async () => {
      // Only select necessary fields for performance
      const { data, error } = await supabase
        .from("participants")
        .select("id, wallet_address, x_handle, avatar_filename, created_at")
        .order("created_at", { ascending: true })

      if (data && !error) {
        setParticipants(data)

        if (address) {
          const userRecord = data.find((p) => p.wallet_address === address)
          setUserParticipant(userRecord || null)
        }
      }
    }

    loadParticipants()

    // Set up real-time subscription with throttling
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
      .subscribe()

    // Throttle realtime updates into batches
    const updateInterval = setInterval(() => {
      setPendingUpdates((pending) => {
        if (pending.length > 0) {
          setParticipants((prev) => [...prev, ...pending])
          
          // Check if any pending updates are for current user
          const userUpdate = pending.find((p) => address && p.wallet_address === address)
          if (userUpdate) {
            setUserParticipant(userUpdate)
          }
          
          return [] // Clear pending updates
        }
        return pending
      })
    }, 500) // Batch updates every 500ms

    return () => {
      supabase.removeChannel(channel)
      clearInterval(updateInterval)
    }
  }, [address])

  // Handle first-time confetti and tweet button
  useEffect(() => {
    if (userParticipant && address) {
      const hasSeenConfetti = localStorage.getItem(`confetti_${address}`)

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
        localStorage.setItem(`confetti_${address}`, "true")
      }
    }
  }, [userParticipant, address])

  const handleTweet = () => {
    const tweetText = `I just placed my tile in the Monument! 🎨 Join the celebration at ${window.location.origin}`
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(tweetUrl, "_blank")
    setShowTweetButton(false)
  }

  const renderMuralGrid = () => {
    const startIndex = currentPage * TILES_PER_PAGE
    const endIndex = startIndex + TILES_PER_PAGE
    const tiles = []

    // Create a 25x25 grid for current page (500 tiles)
    for (let i = 0; i < TILES_PER_PAGE; i++) {
      const globalIndex = startIndex + i
      const participant = participants[globalIndex]
      const isUserTile = participant && userParticipant && participant.id === userParticipant.id
      const shouldLoadImage = loadedImages.has(globalIndex) || i < 50 // Load first 50 immediately

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
            outline: "none"
          }}
          onClick={() => !isMobile && participant && setSelectedImage(participant)}
        >
          {participant && shouldLoadImage ? (
            <Image
              src={getAvatarUrl(participant.avatar_filename) || "/placeholder.svg"}
              alt={`${participant.x_handle}'s avatar`}
              width={80} // Same 80px tiles for both mobile and desktop
              height={80} // Proper image display on all devices
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-purple-800/30" />
          )}

          {isUserTile && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />}
        </div>,
      )
    }

    return (
      <div
        className="grid transition-transform duration-500 ease-in-out"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          gap: "0px",
          width: isMobile ? "95vw" : "85vw", // More space on mobile
          height: isMobile ? "auto" : "auto", // Allow vertical scrolling on mobile
          maxWidth: isMobile ? "95vw" : "85vw",
          aspectRatio: isMobile ? "1/5" : "3/2", // Tall aspect ratio for mobile scrolling
          maxHeight: isMobile ? "80vh" : "none", // Limit height on mobile for scrolling
          overflowY: isMobile ? "auto" : "visible", // Enable vertical scrolling on mobile
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
          onClick={onSecretDoor}
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
                    src={getAvatarUrl(selectedImage.avatar_filename)}
                    alt={`${selectedImage.x_handle}'s avatar`}
                    width={800}
                    height={800}
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                    unoptimized={true}
                    priority={true}
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
