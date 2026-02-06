/**
 * Feed Domain Atoms
 *
 * This file contains atoms for:
 * - Feed type and configuration (relay, relays, following, hashtag)
 * - Relay URLs for current feed
 * - Feed ready state
 */

import { atom } from 'jotai'
import { TFeedInfo } from '@/types'
import { DEFAULT_FAVORITE_RELAYS } from '@/constants'

// ============================================================================
// Feed State Atoms
// ============================================================================

/**
 * Current feed information (type, id, hashtag)
 */
export const feedInfoAtom = atom<TFeedInfo>({
  feedType: 'relay',
  id: DEFAULT_FAVORITE_RELAYS[0]
})

/**
 * Relay URLs for current feed
 */
export const feedRelayUrlsAtom = atom<string[]>([])

/**
 * Whether feed is ready to display
 */
export const feedIsReadyAtom = atom<boolean>(false)
