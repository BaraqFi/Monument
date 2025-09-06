import { createPublicClient, createWalletClient, custom, http, parseAbi } from "viem"
import { monadTestnet } from "viem/chains"

export const MONUMENT_CONTRACT_ADDRESS = "0xF0cBB3bbE6f1c08447bA82B61A4b314A4C22962a" as const

export const MONUMENT_ABI = parseAbi([
  "event Joined(address indexed user, string handle, uint64 time)",
  "function joinMonument(string handle)",
  "function hasJoined(address wallet) view returns (bool)",
  "function participants(address) view returns (string handle, uint64 blockTime)",
  "function totalJoined() view returns (uint256)",
])

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Ethereum provider not found")
  }

  return createWalletClient({
    chain: monadTestnet,
    transport: custom(window.ethereum),
  })
}

export async function hasJoinedContract(walletAddress: `0x${string}`): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: MONUMENT_CONTRACT_ADDRESS,
      abi: MONUMENT_ABI,
      functionName: "hasJoined",
      args: [walletAddress],
    })
    return result
  } catch (error) {
    console.error("Error checking contract participation:", error)
    return false
  }
}

export async function joinMonumentContract(xHandle: string, walletAddress: `0x${string}`): Promise<`0x${string}`> {
  const walletClient = getWalletClient()

  try {
    const hash = await walletClient.writeContract({
      address: MONUMENT_CONTRACT_ADDRESS,
      abi: MONUMENT_ABI,
      functionName: "joinMonument",
      args: [xHandle],
      account: walletAddress,
    })

    return hash
  } catch (error) {
    console.error("Error joining monument:", error)
    throw error
  }
}

export async function getTotalJoined(): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: MONUMENT_CONTRACT_ADDRESS,
      abi: MONUMENT_ABI,
      functionName: "totalJoined",
    })
    return Number(result)
  } catch (error) {
    console.error("Error getting total joined:", error)
    return 0
  }
}
