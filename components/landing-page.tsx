"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface LandingPageProps {
  onJoinClick: () => void
}

export function LandingPage({ onJoinClick }: LandingPageProps) {
  const handleJoinClick = () => {
    // Store user interaction for video audio playback
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
      <h1 className="text-white text-2xl md:text-3xl font-bold mb-4 text-center tracking-wide">
        FOR MONAD, WITH LOVE.
      </h1>

      {/* Creator Credits */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className="text-white/40 text-xs">by</span>
        <a
          href="https://x.com/BaraqFi"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs text-white/70 border border-white/20 rounded-md hover:bg-white/5 hover:text-white/90 hover:border-white/30 transition-all"
        >
          BaraqFi
        </a>
        <span className="text-white/20 text-xs">&</span>
        <a
          href="https://x.com/solhitman"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs text-white/70 border border-white/20 rounded-md hover:bg-white/5 hover:text-white/90 hover:border-white/30 transition-all"
        >
          solhitman
        </a>
      </div>

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
