"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

interface MemePageProps {
  onBack?: () => void
}

export function MemePage({ onBack }: MemePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Check if user has interacted (clicked JOIN button)
    const hasInteracted = localStorage.getItem("monument_user_interacted")
    
    if (hasInteracted === "true" && videoRef.current) {
      // User has interacted, enable sound
      videoRef.current.muted = false
      videoRef.current.play().catch(err => {
        console.log("Autoplay with sound failed, keeping muted:", err)
      })
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: "#200152" }}>
      {/* Back Arrow */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-4 left-4 z-20 p-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-full transition-colors backdrop-blur-sm"
          title="Back to Monument"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="w-full">
        <Image
          src="/doodle-strip.jpeg"
          alt="Doodle Strip"
          width={1200}
          height={120}
          className="w-full h-24 object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Meme Video - Square Container */}
        <div className="w-full max-w-md md:max-w-lg aspect-square rounded-lg overflow-hidden bg-black/20">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/meme-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Credits */}
        <div className="text-center">
          <p className="text-white/60 text-sm">
            Built by{" "}
            <a
              href="https://x.com/BaraqFi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors underline underline-offset-2"
            >
              Baraqfi
            </a>
          </p>
        </div>
      </div>

      <div className="w-full">
        <Image
          src="/doodle-strip.jpeg"
          alt="Doodle Strip"
          width={1200}
          height={120}
          className="w-full h-24 object-cover"
        />
      </div>
    </div>
  )
}
