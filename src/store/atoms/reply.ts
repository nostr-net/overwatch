/**
 * Reply Domain Atoms
 *
 * This file contains atoms for:
 * - Reply tracking and threading
 * - Reply map (event ID -> replies)
 */

import { atom } from 'jotai'
import { Event } from 'nostr-tools'

// ============================================================================
// Reply Atoms
// ============================================================================

/**
 * Map of replies by parent/root event ID
 * eventId -> { events: Event[], eventIdSet: Set<string> }
 */
export const repliesMapAtom = atom<Map<string, { events: Event[]; eventIdSet: Set<string> }>>(
  new Map()
)
