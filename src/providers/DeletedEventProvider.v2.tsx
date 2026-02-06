/**
 * Deleted Event Provider v2
 *
 * Jotai-based implementation that maintains backward compatibility with the Context API.
 * This provider uses Jotai atoms internally but exposes the same Context API interface
 * as the original provider, ensuring zero breaking changes during migration.
 */

import { createContext, useContext } from 'react'
import { NostrEvent } from 'nostr-tools'
import { useDeletedEvent as useDeletedEventHook } from '@/store/hooks/useDeletedEvent'

type TDeletedEventContext = {
  addDeletedEvent: (event: NostrEvent) => void
  isEventDeleted: (event: NostrEvent) => boolean
}

const DeletedEventContext = createContext<TDeletedEventContext | undefined>(undefined)

export const useDeletedEvent = () => {
  const context = useContext(DeletedEventContext)
  if (!context) {
    throw new Error('useDeletedEvent must be used within a DeletedEventProvider')
  }
  return context
}

export function DeletedEventProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai hook internally
  const deletedEvent = useDeletedEventHook()

  return (
    <DeletedEventContext.Provider value={deletedEvent}>
      {children}
    </DeletedEventContext.Provider>
  )
}
