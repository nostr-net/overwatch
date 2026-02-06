/**
 * Content Domain Atoms
 *
 * This file contains atoms for:
 * - Content Policy (NSFW settings, content filtering)
 * - Deleted Events (deleted event tracking)
 * - Mute Lists (public and private mute lists)
 * - Follow Lists (user follow relationships)
 * - Filters (kind filters, hashtag filters)
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import storage from '@/services/local-storage.service'
import { TMediaAutoLoadPolicy } from '@/types'
import { StorageKey } from '@/constants'

// ============================================================================
// Content Policy Atoms
// ============================================================================

/**
 * Whether to autoplay media
 */
export const autoplayAtom = atomWithStorage<boolean>(
  StorageKey.AUTOPLAY,
  storage.getAutoplay()
)

/**
 * Whether to show NSFW content by default
 */
export const defaultShowNsfwAtom = atomWithStorage<boolean>(
  StorageKey.DEFAULT_SHOW_NSFW,
  storage.getDefaultShowNsfw()
)

/**
 * Whether to hide content mentioning muted users
 */
export const hideContentMentioningMutedUsersAtom = atomWithStorage<boolean>(
  StorageKey.HIDE_CONTENT_MENTIONING_MUTED_USERS,
  storage.getHideContentMentioningMutedUsers()
)

/**
 * Media auto-load policy (always, never, wifi-only)
 */
export const mediaAutoLoadPolicyAtom = atomWithStorage<TMediaAutoLoadPolicy>(
  StorageKey.MEDIA_AUTO_LOAD_POLICY,
  storage.getMediaAutoLoadPolicy()
)


/**
 * Whether to hide untrusted notes
 */
export const hideUntrustedNotesAtom = atomWithStorage<boolean>(
  StorageKey.HIDE_UNTRUSTED_NOTES,
  storage.getHideUntrustedNotes()
)

/**
 * Whether to hide untrusted interactions
 */
export const hideUntrustedInteractionsAtom = atomWithStorage<boolean>(
  StorageKey.HIDE_UNTRUSTED_INTERACTIONS,
  storage.getHideUntrustedInteractions()
)

/**
 * Whether to hide untrusted notifications
 */
export const hideUntrustedNotificationsAtom = atomWithStorage<boolean>(
  StorageKey.HIDE_UNTRUSTED_NOTIFICATIONS,
  storage.getHideUntrustedNotifications()
)

/**
 * Web of Trust set - contains pubkeys that are trusted
 * (user's followings + their followings)
 */
export const wotSetAtom = atom<Set<string>>(new Set<string>())

// ============================================================================
// Deleted Events Atoms
// ============================================================================

/**
 * Set of deleted event keys (IDs or replaceable coordinates)
 */
export const deletedEventKeysAtom = atom<Set<string>>(new Set<string>())

// ============================================================================
// Mute List Atoms
// ============================================================================

/**
 * Public mute tags (tags from the mute list event)
 */
export const publicMuteTagsAtom = atom<string[][]>([])

/**
 * Private mute tags (decrypted from the mute list event content)
 */
export const privateMuteTagsAtom = atom<string[][]>([])

/**
 * Whether a mute operation is in progress
 */
export const muteChangingAtom = atom<boolean>(false)

// ============================================================================
// Favorite Relays Atoms
// ============================================================================

import { Event } from 'nostr-tools'
import type { TRelaySet } from '@/types'

/**
 * Favorite relay URLs
 */
export const favoriteRelaysAtom = atom<string[]>([])

/**
 * Relay set events from Nostr
 */
export const relaySetEventsAtom = atom<Event[]>([])

/**
 * Parsed relay sets (derived from relay set events)
 */
export const relaySetsAtom = atom<TRelaySet[]>([])

// ============================================================================
// Follow List Atoms
// ============================================================================

/**
 * Set of pubkeys that the current user follows
 */
export const followingSetAtom = atom<Set<string>>(new Set<string>())

// ============================================================================
// Filter Atoms (Placeholder)
// ============================================================================

/**
 * Enabled event kinds
 */
export const showKindsAtom = atom<number[]>(
  storage.getShowKinds()
)
