/**
 * Nostr Domain Atoms
 *
 * This file contains atoms for:
 * - Account management (current account, account list, authentication)
 * - Connection state (relay connections)
 * - Profile data (user profiles, profile updates)
 * - Publishing (event creation and publishing)
 * - Signer management (ISigner instances)
 *
 * Sprint 3: Full NostrProvider migration complete
 */

import { atom } from 'jotai'
import { TAccountPointer, TProfile, TRelayList, ISigner } from '@/types'
import storage from '@/services/local-storage.service'
import { Event } from 'nostr-tools'

// ============================================================================
// AUTH ATOMS - Account & Session Management
// ============================================================================

/**
 * Current logged-in account pointer (pubkey + signer type)
 */
export const currentAccountAtom = atom<TAccountPointer | null>(null)

/**
 * List of all accounts
 */
export const accountsAtom = atom<TAccountPointer[]>(
  storage.getAccounts().map((act) => ({ pubkey: act.pubkey, signerType: act.signerType }))
)

/**
 * Current signer instance
 */
export const signerAtom = atom<ISigner | null>(null)

/**
 * NSec key (if using nsec authentication)
 */
export const nsecAtom = atom<string | null>(null)

/**
 * Encrypted nsec key (if using ncryptsec authentication)
 */
export const ncryptsecAtom = atom<string | null>(null)

/**
 * Login dialog open state
 */
export const loginDialogOpenAtom = atom<boolean>(false)

/**
 * Initialization status
 */
export const isInitializedAtom = atom<boolean>(false)

/**
 * Derived: Current pubkey from account
 */
export const currentPubkeyAtom = atom((get) => get(currentAccountAtom)?.pubkey ?? null)

// ============================================================================
// PROFILE ATOMS - User Profile Management
// ============================================================================

/**
 * Current user's profile
 */
export const profileAtom = atom<TProfile | null>(null)

/**
 * Current user's profile event
 */
export const profileEventAtom = atom<Event | null>(null)

/**
 * Current user's relay list
 */
export const relayListAtom = atom<TRelayList | null>(null)

/**
 * Follow list event
 */
export const followListEventAtom = atom<Event | null>(null)

/**
 * Mute list event
 */
export const muteListEventAtom = atom<Event | null>(null)

/**
 * Bookmark list event
 */
export const bookmarkListEventAtom = atom<Event | null>(null)

/**
 * Favorite relays event
 */
export const favoriteRelaysEventAtom = atom<Event | null>(null)

/**
 * User emoji list event
 */
export const userEmojiListEventAtom = atom<Event | null>(null)

/**
 * Pin list event
 */
export const pinListEventAtom = atom<Event | null>(null)

/**
 * Last notifications seen timestamp
 */
export const notificationsSeenAtAtom = atom<number>(-1)

// ============================================================================
// Connection Atoms
// ============================================================================

/**
 * Relay connection state
 */
export const relayConnectionsAtom = atom<Map<string, 'connected' | 'connecting' | 'disconnected'>>(
  new Map()
)

/**
 * User profile cache
 */
export const profileCacheAtom = atom<Map<string, any>>(
  new Map()
)
