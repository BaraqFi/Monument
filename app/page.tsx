"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { checkExistingParticipant } from "@/lib/supabase-utils"
import { LandingPage } from "@/components/landing-page"
import { HandleAvatarPage } from "@/components/handle-avatar-page"
import { CelebrationWall } from "@/components/celebration-wall"
import { MemePage } from "@/components/meme-page"

type AppStep = "landing" | "handle" | "celebration" | "meme"

export default function Home() {
  const { address, isConnected } = useAccount()
  const [currentStep, setCurrentStep] = useState<AppStep>("landing")
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing participant on wallet connection
  useEffect(() => {
    const checkParticipant = async () => {
      if (isConnected && address) {
        const existingParticipant = await checkExistingParticipant(address)
        if (existingParticipant) {
          // Skip to celebration wall if already participated
          setCurrentStep("celebration")
        } else {
          // Go to handle page if connected but not participated
          setCurrentStep("handle")
        }
      }
      setIsLoading(false)
    }

    if (isConnected) {
      checkParticipant()
    } else {
      setIsLoading(false)
    }
  }, [isConnected, address])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#200152" }}>
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const handleWalletConnected = () => {
    setCurrentStep("handle")
  }

  const handleParticipationComplete = () => {
    setCurrentStep("celebration")
  }

  const handleSecretDoor = () => {
    setCurrentStep("meme")
  }

  const handleBackFromSecret = () => {
    setCurrentStep("celebration")
  }

  switch (currentStep) {
    case "landing":
      return <LandingPage onWalletConnected={handleWalletConnected} />

    case "handle":
      return <HandleAvatarPage onComplete={handleParticipationComplete} />

    case "celebration":
      return <CelebrationWall onSecretDoor={handleSecretDoor} onBackFromSecret={handleBackFromSecret} />

    case "meme":
      return <MemePage onBack={handleBackFromSecret} />

    default:
      return <LandingPage onWalletConnected={handleWalletConnected} />
  }
}
