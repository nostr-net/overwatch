/**
 * Favorite Relays Provider v2
 *
 * Jotai-based implementation that maintains backward compatibility with the Context API.
 * This provider uses Jotai atoms internally but exposes the same Context API interface
 * as the original provider, ensuring zero breaking changes during migration.
 */

import { createContext, useContext } from 'react'
import { Event } from 'nostr-tools'
import type { TRelaySet } from '@/types'
import { useFavoriteRelays as useFavoriteRelaysHook } from '@/store/hooks/useFavoriteRelays'

type TFavoriteRelaysContext = {
  favoriteRelays: string[]
  addFavoriteRelays: (relayUrls: string[]) => Promise<void>
  deleteFavoriteRelays: (relayUrls: string[]) => Promise<void>
  reorderFavoriteRelays: (reorderedRelays: string[]) => Promise<void>
  relaySets: TRelaySet[]
  createRelaySet: (relaySetName: string, relayUrls?: string[]) => Promise<void>
  addRelaySets: (newRelaySetEvents: Event[]) => Promise<void>
  deleteRelaySet: (id: string) => Promise<void>
  updateRelaySet: (newSet: TRelaySet) => Promise<void>
  reorderRelaySets: (reorderedSets: TRelaySet[]) => Promise<void>
}

const FavoriteRelaysContext = createContext<TFavoriteRelaysContext | undefined>(undefined)

export const useFavoriteRelays = () => {
  const context = useContext(FavoriteRelaysContext)
  if (!context) {
    throw new Error('useFavoriteRelays must be used within a FavoriteRelaysProvider')
  }
  return context
}

export function FavoriteRelaysProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai hook internally
  const favoriteRelays = useFavoriteRelaysHook()

  return (
    <FavoriteRelaysContext.Provider value={favoriteRelays}>
      {children}
    </FavoriteRelaysContext.Provider>
  )
}
