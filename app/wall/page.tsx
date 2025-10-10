"use client"

import { CelebrationWall } from "@/components/celebration-wall"
import { useRouter } from "next/navigation"

export default function WallPage() {
  const router = useRouter()

  const handleSecretDoor = () => {
    router.push("/meme")
  }

  const handleBackFromSecret = () => {
    router.push("/wall")
  }

  return <CelebrationWall onSecretDoor={handleSecretDoor} onBackFromSecret={handleBackFromSecret} />
}

