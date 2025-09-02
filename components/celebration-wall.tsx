"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { createClient } from "@/lib/supabase/client"
import { getAvatarUrl } from "@/lib/supabase-utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { Participant } from "@/lib/types"
import confetti from "canvas-confetti"

interface CelebrationWallProps {
  onSecretDoor: () => void
}

export function CelebrationWall({ onSecretDoor }: CelebrationWallProps) {
  const { address } = useAccount()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [userParticipant, setUserParticipant] = useState<Participant | null>(null)
  const [showTweetButton, setShowTweetButton] = useState(false)

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

    // Set up real-time subscription
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
          setParticipants((prev) => [...prev, newParticipant])

          if (address && newParticipant.wallet_address === address) {
            setUserParticipant(newParticipant)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [address])

  // Handle first-time confetti and tweet button
  useEffect(() => {
    if (userParticipant && address) {
      const hasSeenConfetti = localStorage.getItem(`confetti_${address}`)

      if (!hasSeenConfetti) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
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
    const gridSize = 100
    const tiles = []

    for (let i = 0; i < 10000; i++) {
      const participant = participants[i]
      const isUserTile = participant && userParticipant && participant.id === userParticipant.id

      tiles.push(
        <div
          key={i}
          className={`aspect-square border border-white/10 flex items-center justify-center relative ${
            isUserTile ? "ring-1 ring-yellow-400 ring-opacity-80 shadow-sm shadow-yellow-400/50" : ""
          }`}
          style={{ backgroundColor: participant ? "transparent" : "#937cdf20" }}
        >
          {participant ? (
            <Image
              src={getAvatarUrl(participant.avatar_filename) || "/placeholder.svg"}
              alt={`${participant.x_handle}'s avatar`}
              width={32}
              height={32}
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
        className="grid mx-auto mb-8"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gap: "1px",
          maxWidth: "90vw",
          aspectRatio: "1",
        }}
      >
        {tiles}
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#200152" }}>
      <div className="w-full">
        <Image
          src="/doodle-strip.jpeg"
          alt="Doodle Strip"
          width={1200}
          height={120}
          className="w-full h-24 object-cover"
        />
      </div>

      <div className="px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-4">{participants.length} / 10000 placed</h1>
        </div>

        {renderMuralGrid()}

        {showTweetButton && (
          <div className="text-center">
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

      <div className="fixed bottom-4 right-4 z-10">
        <button
          onClick={onSecretDoor}
          className="text-2xl hover:scale-110 transition-transform duration-300 animate-pulse"
          title="Secret door"
        >
          🚪
        </button>
      </div>
    </div>
  )
}
