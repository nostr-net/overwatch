/**
 * Derived Atoms
 *
 * This file contains computed/derived atoms that depend on other atoms.
 * These atoms automatically recompute when their dependencies change.
 */

import { atom } from 'jotai'
import {
  publicMuteTagsAtom,
  privateMuteTagsAtom,
  followingSetAtom
} from './content'
import { getPubkeysFromPTags } from '@/lib/tag'

// ============================================================================
// Mute List Derived Atoms
// ============================================================================

/**
 * Combined mute list (public + private)
 * Returns a Set of all muted pubkeys
 */
export const combinedMuteListAtom = atom<Set<string>>((get) => {
  const publicMuteTags = get(publicMuteTagsAtom)
  const privateMuteTags = get(privateMuteTagsAtom)

  const publicPubkeys = getPubkeysFromPTags(publicMuteTags)
  const privatePubkeys = getPubkeysFromPTags(privateMuteTags)

  const combined = new Set<string>()
  publicPubkeys.forEach((pubkey: string) => combined.add(pubkey))
  privatePubkeys.forEach((pubkey: string) => combined.add(pubkey))

  return combined
})

/**
 * Check if a pubkey is muted (public or private)
 * Returns a function that takes a pubkey and returns boolean
 */
export const isMutedAtom = atom((get) => {
  const combinedMuteList = get(combinedMuteListAtom)
  return (pubkey: string) => combinedMuteList.has(pubkey)
})

// ============================================================================
// Follow List Derived Atoms
// ============================================================================

/**
 * Check if a pubkey is followed
 * Returns a function that takes a pubkey and returns boolean
 */
export const isFollowingAtom = atom((get) => {
  const followingSet = get(followingSetAtom)
  return (pubkey: string) => followingSet.has(pubkey)
})

/**
 * Followed users who are not muted
 * Returns a Set of trusted followed pubkeys
 */
export const trustedFollowsAtom = atom<Set<string>>((get) => {
  const followingSet = get(followingSetAtom)
  const combinedMuteList = get(combinedMuteListAtom)

  const trusted = new Set<string>()
  followingSet.forEach((pubkey: string) => {
    if (!combinedMuteList.has(pubkey)) {
      trusted.add(pubkey)
    }
  })

  return trusted
})

// ============================================================================
// User Trust Derived Atoms
// ============================================================================

/**
 * Calculate basic trust score for a user
 * Returns a function that takes a pubkey and returns a trust score (0-1)
 * This is a simple implementation - can be enhanced with more sophisticated algorithms
 */
export const calculateTrustScoreAtom = atom((get) => {
  const followingSet = get(followingSetAtom)
  const combinedMuteList = get(combinedMuteListAtom)

  return (pubkey: string): number => {
    if (combinedMuteList.has(pubkey)) return 0
    if (followingSet.has(pubkey)) return 1
    // Web of trust calculation handled in useUserTrust hook
    return 0.5
  }
})

// ============================================================================
// Content Filter Derived Atoms
// ============================================================================

/**
 * Check if content should be hidden based on mute list
 * Returns a function that takes a list of pubkeys and returns boolean
 */
export const shouldHideContentAtom = atom((get) => {
  const combinedMuteList = get(combinedMuteListAtom)

  return (pubkeys: string[]): boolean => {
    return pubkeys.some(pubkey => combinedMuteList.has(pubkey))
  }
})
