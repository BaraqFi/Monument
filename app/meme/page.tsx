"use client"

import { MemePage } from "@/components/meme-page"
import { useRouter } from "next/navigation"

export default function MemePageRoute() {
  const router = useRouter()

  const handleBack = () => {
    router.push("/wall")
  }

  return <MemePage onBack={handleBack} />
}

