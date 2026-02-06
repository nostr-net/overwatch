/**
 * Content Policy Hook
 *
 * Provides access to content policy settings including:
 * - Autoplay
 * - NSFW content filtering
 * - Media auto-load policies
 * - Connection-aware media loading
 */

import { useAtom } from 'jotai'
import {
  autoplayAtom,
  defaultShowNsfwAtom,
  hideContentMentioningMutedUsersAtom,
  mediaAutoLoadPolicyAtom
} from '@/store/atoms/content'
import storage from '@/services/local-storage.service'
import { TMediaAutoLoadPolicy } from '@/types'
import { MEDIA_AUTO_LOAD_POLICY } from '@/constants'
import { useEffect, useState, useMemo } from 'react'

export function useContentPolicy() {
  const [autoplay, setAutoplayAtom] = useAtom(autoplayAtom)
  const [defaultShowNsfw, setDefaultShowNsfwAtom] = useAtom(defaultShowNsfwAtom)
  const [hideContentMentioningMutedUsers, setHideContentMentioningMutedUsersAtom] = useAtom(
    hideContentMentioningMutedUsersAtom
  )
  const [mediaAutoLoadPolicy, setMediaAutoLoadPolicyAtom] = useAtom(mediaAutoLoadPolicyAtom)
  const [connectionType, setConnectionType] = useState<string | undefined>((navigator as any).connection?.type)

  // Compute autoLoadMedia based on policy and connection type
  const autoLoadMedia = useMemo(() => {
    if (mediaAutoLoadPolicy === MEDIA_AUTO_LOAD_POLICY.ALWAYS) {
      return true
    }
    if (mediaAutoLoadPolicy === MEDIA_AUTO_LOAD_POLICY.NEVER) {
      return false
    }
    // WIFI_ONLY
    return connectionType === 'wifi' || connectionType === 'ethernet'
  }, [mediaAutoLoadPolicy, connectionType])

  // Set up connection type listener
  useEffect(() => {
    const connection = (navigator as any).connection
    if (!connection) {
      setConnectionType(undefined)
      return
    }
    const handleConnectionChange = () => {
      setConnectionType(connection.type)
    }
    connection.addEventListener('change', handleConnectionChange)
    return () => {
      connection.removeEventListener('change', handleConnectionChange)
    }
  }, [])

  const setAutoplay = (value: boolean) => {
    storage.setAutoplay(value)
    setAutoplayAtom(value)
  }

  const setDefaultShowNsfw = (value: boolean) => {
    storage.setDefaultShowNsfw(value)
    setDefaultShowNsfwAtom(value)
  }

  const setHideContentMentioningMutedUsers = (value: boolean) => {
    storage.setHideContentMentioningMutedUsers(value)
    setHideContentMentioningMutedUsersAtom(value)
  }

  const setMediaAutoLoadPolicy = (policy: TMediaAutoLoadPolicy) => {
    storage.setMediaAutoLoadPolicy(policy)
    setMediaAutoLoadPolicyAtom(policy)
  }

  return {
    autoplay,
    setAutoplay,
    defaultShowNsfw,
    setDefaultShowNsfw,
    hideContentMentioningMutedUsers,
    setHideContentMentioningMutedUsers,
    autoLoadMedia,
    mediaAutoLoadPolicy,
    setMediaAutoLoadPolicy
  }
}
