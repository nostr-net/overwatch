/**
 * Content Policy Provider v2
 *
 * Jotai-based implementation that maintains backward compatibility with the Context API.
 * This provider uses Jotai atoms internally but exposes the same Context API interface
 * as the original provider, ensuring zero breaking changes during migration.
 */

import { createContext, useContext } from 'react'
import { TMediaAutoLoadPolicy } from '@/types'
import { useContentPolicy as useContentPolicyHook } from '@/store/hooks/useContentPolicy'

type TContentPolicyContext = {
  autoplay: boolean
  setAutoplay: (autoplay: boolean) => void

  defaultShowNsfw: boolean
  setDefaultShowNsfw: (showNsfw: boolean) => void

  hideContentMentioningMutedUsers?: boolean
  setHideContentMentioningMutedUsers?: (hide: boolean) => void

  autoLoadMedia: boolean
  mediaAutoLoadPolicy: TMediaAutoLoadPolicy
  setMediaAutoLoadPolicy: (policy: TMediaAutoLoadPolicy) => void
}

const ContentPolicyContext = createContext<TContentPolicyContext | undefined>(undefined)

export const useContentPolicy = () => {
  const context = useContext(ContentPolicyContext)
  if (!context) {
    throw new Error('useContentPolicy must be used within an ContentPolicyProvider')
  }
  return context
}

export function ContentPolicyProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai hook internally
  const contentPolicy = useContentPolicyHook()

  return (
    <ContentPolicyContext.Provider value={contentPolicy}>
      {children}
    </ContentPolicyContext.Provider>
  )
}
