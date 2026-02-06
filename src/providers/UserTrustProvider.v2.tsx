/**
 * User Trust Provider v2
 *
 * Jotai-based implementation that maintains backward compatibility with the Context API.
 * This provider uses Jotai atoms internally but exposes the same Context API interface
 * as the original provider, ensuring zero breaking changes during migration.
 *
 * Manages Web of Trust (WoT) by tracking user's followings and their followings.
 */

import { createContext, useContext } from 'react'
import { useUserTrust as useUserTrustHook } from '@/store/hooks/useUserTrust'

type TUserTrustContext = {
  hideUntrustedInteractions: boolean
  hideUntrustedNotifications: boolean
  hideUntrustedNotes: boolean
  updateHideUntrustedInteractions: (hide: boolean) => void
  updateHideUntrustedNotifications: (hide: boolean) => void
  updateHideUntrustedNotes: (hide: boolean) => void
  isUserTrusted: (pubkey: string) => boolean
}

const UserTrustContext = createContext<TUserTrustContext | undefined>(undefined)

export const useUserTrust = () => {
  const context = useContext(UserTrustContext)
  if (!context) {
    throw new Error('useUserTrust must be used within a UserTrustProvider')
  }
  return context
}

export function UserTrustProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai hook internally
  const userTrust = useUserTrustHook()

  return (
    <UserTrustContext.Provider value={userTrust}>
      {children}
    </UserTrustContext.Provider>
  )
}
