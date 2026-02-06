/**
 * Feed Hook
 *
 * Feed type and relay URL management
 */

import { useAtom } from 'jotai'
import { feedInfoAtom, feedRelayUrlsAtom, feedIsReadyAtom } from '../atoms/feed'

export function useFeed() {
  const [feedInfo, setFeedInfo] = useAtom(feedInfoAtom)
  const [relayUrls, setRelayUrls] = useAtom(feedRelayUrlsAtom)
  const [isReady, setIsReady] = useAtom(feedIsReadyAtom)

  return {
    feedInfo,
    relayUrls,
    isReady,
    setFeedInfo,
    setRelayUrls,
    setIsReady
  }
}
