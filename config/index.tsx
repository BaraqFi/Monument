import { cookieStorage, createStorage } from "wagmi"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { monadTestnet, mainnet, arbitrum } from "@reown/appkit/networks"

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error("No Project ID defined.")
}

export const networks = [monadTestnet, mainnet, arbitrum]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  networks,
  projectId,
})

export const config = wagmiAdapter.wagmiConfig
