"use client"

import { HandleAvatarPage } from "@/components/handle-avatar-page"
import { useRouter } from "next/navigation"

export default function JoinPage() {
  const router = useRouter()

  const handleParticipationComplete = () => {
    router.push("/wall")
  }

  const handleViewWall = () => {
    router.push("/wall")
  }

  return <HandleAvatarPage onComplete={handleParticipationComplete} onViewWall={handleViewWall} />
}

