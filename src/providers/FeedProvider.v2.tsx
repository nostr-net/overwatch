/**
 * FeedProvider v2 - Jotai-based Bridge Provider
 *
 * Backward compatible Context API provider using Jotai atoms
 */

import { DEFAULT_FAVORITE_RELAYS } from '@/constants'
import { getRelaySetFromEvent } from '@/lib/event-metadata'
import { isWebsocketUrl, normalizeUrl } from '@/lib/url'
import indexedDb from '@/services/indexed-db.service'
import storage from '@/services/local-storage.service'
import { TFeedInfo, TFeedType } from '@/types'
import { kinds } from 'nostr-tools'
import { createContext, useContext, useEffect, useRef } from 'react'
import { useFavoriteRelays } from './FavoriteRelaysProvider'
import { useNostr } from './NostrProvider'
import { useFeed as useFeedStore } from '@/store/hooks/useFeed'

type TFeedContext = {
  feedInfo: TFeedInfo
  relayUrls: string[]
  isReady: boolean
  switchFeed: (
    feedType: TFeedType,
    options?: { activeRelaySetId?: string; pubkey?: string; relay?: string | null; hashtag?: string | null }
  ) => Promise<void>
}

const FeedContext = createContext<TFeedContext | undefined>(undefined)

export const useFeed = () => {
  const context = useContext(FeedContext)
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider')
  }
  return context
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const { pubkey, isInitialized } = useNostr()
  const { relaySets, favoriteRelays } = useFavoriteRelays()
  const store = useFeedStore()
  const feedInfoRef = useRef<TFeedInfo>(store.feedInfo)

  useEffect(() => {
    feedInfoRef.current = store.feedInfo
  }, [store.feedInfo])

  useEffect(() => {
    const init = async () => {
      if (!isInitialized) return

      let feedInfo: TFeedInfo = {
        feedType: 'relay',
        id: favoriteRelays[0] ?? DEFAULT_FAVORITE_RELAYS[0]
      }
      if (pubkey) {
        const storedFeedInfo = storage.getFeedInfo(pubkey)
        if (storedFeedInfo) {
          feedInfo = storedFeedInfo
        }
      }

      if (feedInfo.feedType === 'relays') {
        return await switchFeed('relays', { activeRelaySetId: feedInfo.id })
      }

      if (feedInfo.feedType === 'relay') {
        return await switchFeed('relay', { relay: feedInfo.id })
      }

      if (feedInfo.feedType === 'following' && pubkey) {
        return await switchFeed('following', { pubkey })
      }

      if (feedInfo.feedType === 'hashtag' && feedInfo.hashtag) {
        return await switchFeed('hashtag', { hashtag: feedInfo.hashtag })
      }
    }

    init()
  }, [pubkey, isInitialized])

  const switchFeed = async (
    feedType: TFeedType,
    options: {
      activeRelaySetId?: string | null
      pubkey?: string | null
      relay?: string | null
      hashtag?: string | null
    } = {}
  ) => {
    store.setIsReady(false)
    if (feedType === 'relay') {
      const normalizedUrl = normalizeUrl(options.relay ?? '')
      if (!normalizedUrl || !isWebsocketUrl(normalizedUrl)) {
        store.setIsReady(true)
        return
      }

      const newFeedInfo = { feedType, id: normalizedUrl }
      store.setFeedInfo(newFeedInfo)
      feedInfoRef.current = newFeedInfo
      store.setRelayUrls([normalizedUrl])
      storage.setFeedInfo(newFeedInfo, pubkey)
      store.setIsReady(true)
      return
    }
    if (feedType === 'relays') {
      const relaySetId = options.activeRelaySetId ?? (relaySets.length > 0 ? relaySets[0].id : null)
      if (!relaySetId || !pubkey) {
        store.setIsReady(true)
        return
      }

      let relaySet =
        relaySets.find((set) => set.id === relaySetId) ??
        (relaySets.length > 0 ? relaySets[0] : null)
      if (!relaySet) {
        const storedRelaySetEvent = await indexedDb.getReplaceableEvent(
          pubkey,
          kinds.Relaysets,
          relaySetId
        )
        if (storedRelaySetEvent) {
          relaySet = getRelaySetFromEvent(storedRelaySetEvent)
        }
      }
      if (relaySet) {
        const newFeedInfo = { feedType, id: relaySet.id }
        store.setFeedInfo(newFeedInfo)
        feedInfoRef.current = newFeedInfo
        store.setRelayUrls(relaySet.relayUrls)
        storage.setFeedInfo(newFeedInfo, pubkey)
        store.setIsReady(true)
      }
      store.setIsReady(true)
      return
    }
    if (feedType === 'following') {
      if (!options.pubkey) {
        store.setIsReady(true)
        return
      }
      const newFeedInfo = { feedType }
      store.setFeedInfo(newFeedInfo)
      feedInfoRef.current = newFeedInfo
      storage.setFeedInfo(newFeedInfo, pubkey)
      store.setRelayUrls([])
      store.setIsReady(true)
      return
    }
    if (feedType === 'hashtag') {
      if (!options.hashtag) {
        store.setIsReady(true)
        return
      }
      const newFeedInfo = { feedType, hashtag: options.hashtag }
      store.setFeedInfo(newFeedInfo)
      feedInfoRef.current = newFeedInfo
      storage.setFeedInfo(newFeedInfo, pubkey)
      store.setRelayUrls([])
      store.setIsReady(true)
      return
    }
    store.setIsReady(true)
  }

  return (
    <FeedContext.Provider
      value={{
        feedInfo: store.feedInfo,
        relayUrls: store.relayUrls,
        isReady: store.isReady,
        switchFeed
      }}
    >
      {children}
    </FeedContext.Provider>
  )
}
