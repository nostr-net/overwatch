/**
 * ReplyProvider v2 - Jotai-based Bridge Provider
 *
 * Backward compatible Context API provider using Jotai atoms
 */

import { Event } from 'nostr-tools'
import { createContext, useContext } from 'react'
import { useReply as useReplyStore } from '@/store/hooks/useReply'

type TReplyContext = {
  repliesMap: Map<string, { events: Event[]; eventIdSet: Set<string> }>
  addReplies: (replies: Event[]) => void
}

const ReplyContext = createContext<TReplyContext | undefined>(undefined)

export const useReply = () => {
  const context = useContext(ReplyContext)
  if (!context) {
    throw new Error('useReply must be used within a ReplyProvider')
  }
  return context
}

export function ReplyProvider({ children }: { children: React.ReactNode }) {
  const store = useReplyStore()

  return (
    <ReplyContext.Provider
      value={{
        repliesMap: store.repliesMap,
        addReplies: store.addReplies
      }}
    >
      {children}
    </ReplyContext.Provider>
  )
}
