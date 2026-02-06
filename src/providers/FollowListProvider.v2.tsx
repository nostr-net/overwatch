/**
 * Follow List Provider v2
 *
 * Jotai-based implementation that maintains backward compatibility with the Context API.
 * This provider uses Jotai atoms internally but exposes the same Context API interface
 * as the original provider, ensuring zero breaking changes during migration.
 */

import { createContext, useContext } from 'react'
import { useFollowList as useFollowListHook } from '@/store/hooks/useFollowList'

type TFollowListContext = {
  followingSet: Set<string>
  follow: (pubkey: string) => Promise<void>
  unfollow: (pubkey: string) => Promise<void>
}

const FollowListContext = createContext<TFollowListContext | undefined>(undefined)

export const useFollowList = () => {
  const context = useContext(FollowListContext)
  if (!context) {
    throw new Error('useFollowList must be used within a FollowListProvider')
  }
  return context
}

export function FollowListProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai hook internally
  const followList = useFollowListHook()

  return (
    <FollowListContext.Provider value={followList}>
      {children}
    </FollowListContext.Provider>
  )
}
