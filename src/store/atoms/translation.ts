/**
 * Translation Service Domain Atoms
 *
 * This file contains atoms for:
 * - Translation service configuration
 * - Translation cache
 * - Translated event tracking
 */

import { atom } from 'jotai'
import { TTranslationServiceConfig } from '@/types'

// ============================================================================
// Translation Configuration Atoms
// ============================================================================

/**
 * Translation service configuration
 */
export const translationConfigAtom = atom<TTranslationServiceConfig>({ service: 'jumble' })

/**
 * Set of translated event IDs
 */
export const translatedEventIdSetAtom = atom<Set<string>>(new Set<string>())

/**
 * Translation event cache
 * Maps: targetLanguage_eventId -> translatedEvent
 */
export const translatedEventCacheAtom = atom<Map<string, any>>(new Map())

/**
 * Translation text cache
 * Maps: targetLanguage_text -> translatedText
 */
export const translatedTextCacheAtom = atom<Map<string, string>>(new Map())
