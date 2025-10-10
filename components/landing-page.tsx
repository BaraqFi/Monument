"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface LandingPageProps {
  onJoinClick: () => void
}

export function LandingPage({ onJoinClick }: LandingPageProps) {
  const handleJoinClick = () => {
    // Store user interaction for audio playback on meme page
    localStorage.setItem("monument_user_interacted", "true")
    onJoinClick()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#200152" }}
    >
      {/* Monad Logo */}
      <div className="mb-8">
        <Image src="/monad-logo.png" alt="Monad Logo" width={120} height={120} className="mx-auto" />
      </div>

      {/* Title Text */}
      <h1 className="text-white text-2xl md:text-3xl font-bold mb-12 text-center tracking-wide">
        FOR MONAD, WITH LOVE.
      </h1>

      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleJoinClick}
          className="px-8 py-6 text-lg font-semibold text-white rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#937cdf" }}
        >
          JOIN THE MONUMENT
        </Button>
      </div>
    </div>
  )
}
