"use client"

import { projectId, wagmiAdapter } from "@/config"
import { createAppKit } from "@reown/appkit"
import { monadTestnet, mainnet, arbitrum } from "@reown/appkit/networks"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi"

const queryClient = new QueryClient()

if (!projectId) {
  throw new Error("No ProjectID Defined")
}

const metadata = {
  name: "Monument dApp",
  description: "For Monad, With Love - Monument dApp",
  url: "https://monument.monad.xyz",
}

const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [monadTestnet, mainnet, arbitrum],
  defaultNetwork: monadTestnet,
  themeMode: "dark",
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
