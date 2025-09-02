import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import ContextProvider from "@/context"
import { headers } from "next/headers"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "Monument - For Monad, With Love",
  description: "A Monument dApp for the Monad community - Join the celebration and leave your mark on the blockchain",
  keywords: "Monad, Monument, dApp, blockchain, crypto, community",
  authors: [{ name: "Monad Community" }],
  creator: "Monad Community",
  publisher: "Monad Community",

  // Open Graph metadata for social sharing
  openGraph: {
    title: "Monument - For Monad, With Love",
    description: "A Monument dApp for the Monad community - Join the celebration and leave your mark on the blockchain",
    url: "https://monument.monad.xyz",
    siteName: "Monument",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Monument - For Monad, With Love",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Monument - For Monad, With Love",
    description: "A Monument dApp for the Monad community - Join the celebration and leave your mark on the blockchain",
    images: ["/og-image.jpeg"],
    creator: "@MonadXYZ",
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieHeaders = await headers()
  const cookies = cookieHeaders.get("cookie")


  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}
