"use client"

import Image from "next/image"

interface MemePageProps {
  onBack?: () => void
}

export function MemePage({ onBack }: MemePageProps) {
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

      <div className="flex-1 flex flex-col items-center justify-center px-6">
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
