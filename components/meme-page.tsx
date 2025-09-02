"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

export function MemePage() {
  const [copied, setCopied] = useState(false)
  const discordHandle = "baraqfi"

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(discordHandle)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#200152" }}>
      <div className="w-full">
        <Image
          src="/doodle-strip.jpeg"
          alt="Doodle Strip"
          width={1200}
          height={120}
          className="w-full h-24 object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-8">
          {/* Main Question */}
          <h1 className="text-white text-4xl md:text-6xl font-bold tracking-wide">WEN FULL ACCESS?</h1>

          <div className="space-y-2">
            <p className="text-white/80 text-xl md:text-2xl">Discord: {discordHandle}</p>
            <p className="text-white/80 text-xl md:text-2xl">𝕏: BaraqFi</p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleCopyDiscord}
              className="text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#937cdf" }}
            >
              {copied ? "Copied! ✓" : "Copy Handle"}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <Image src="/casino-logo.png" alt="Casino Logo" width={24} height={24} className="opacity-80" />
            <a
              href="https://casino-mon.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 text-sm hover:text-white/80 transition-colors underline"
            >
              Enter the Casino
            </a>
          </div>

          <p className="text-white/60 text-sm mt-8">blz give full access 💜</p>
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
