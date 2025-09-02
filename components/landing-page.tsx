"use client"

import { useAccount } from "wagmi"
import Image from "next/image"
import { useEffect, useState } from "react"

interface LandingPageProps {
  onWalletConnected: () => void
}

export function LandingPage({ onWalletConnected }: LandingPageProps) {
  const { isConnected } = useAccount()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (isConnected) {
      // Fade out and move to next step
      setIsVisible(false)
      setTimeout(() => {
        onWalletConnected()
      }, 500)
    }
  }, [isConnected, onWalletConnected])

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
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
        <w3m-button />
        {isConnected && <p className="text-white text-sm opacity-75">Wallet connected! Redirecting...</p>}
      </div>
    </div>
  )
}
