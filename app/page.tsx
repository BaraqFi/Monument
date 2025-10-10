"use client"

import { LandingPage } from "@/components/landing-page"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  const handleJoinClick = () => {
    router.push("/join")
  }

  return <LandingPage onJoinClick={handleJoinClick} />
}
