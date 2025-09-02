export interface Participant {
  id: string
  wallet_address: string
  x_handle: string
  avatar_filename: string
  created_at: string
}

export interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}
