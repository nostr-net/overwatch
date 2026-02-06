/**
 * Filter Domain Atoms
 *
 * This file contains atoms for:
 * - Kind filter (which event kinds to show)
 */

import { atom } from 'jotai'
import storage from '@/services/local-storage.service'

// ============================================================================
// Kind Filter Atoms
// ============================================================================

/**
 * List of event kinds to show
 */
export const showKindsAtom = atom<number[]>(storage.getShowKinds())
