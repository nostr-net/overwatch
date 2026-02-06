/**
 * Mute List Provider v2
 *
 * Jotai-based implementation that maintains backward compatibility with the Context API.
 * This provider uses Jotai atoms internally but exposes the same Context API interface
 * as the original provider, ensuring zero breaking changes during migration.
 *
 * Handles both public and private muting with NIP-04 encryption.
 */

import { createContext, useContext } from 'react'
import { useMuteList as useMuteListHook } from '@/store/hooks/useMuteList'

type TMuteListContext = {
  mutePubkeySet: Set<string>
  changing: boolean
  getMutePubkeys: () => string[]
  getMuteType: (pubkey: string) => 'public' | 'private' | null
  mutePubkeyPublicly: (pubkey: string) => Promise<void>
  mutePubkeyPrivately: (pubkey: string) => Promise<void>
  unmutePubkey: (pubkey: string) => Promise<void>
  switchToPublicMute: (pubkey: string) => Promise<void>
  switchToPrivateMute: (pubkey: string) => Promise<void>
}

const MuteListContext = createContext<TMuteListContext | undefined>(undefined)

export const useMuteList = () => {
  const context = useContext(MuteListContext)
  if (!context) {
    throw new Error('useMuteList must be used within a MuteListProvider')
  }
  return context
}

export function MuteListProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai hook internally
  const muteList = useMuteListHook()

  return (
    <MuteListContext.Provider value={muteList}>
      {children}
    </MuteListContext.Provider>
  )
}
