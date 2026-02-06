/**
 * Zap Domain Atoms
 *
 * This file contains atoms for:
 * - Lightning wallet connection state
 * - Zap configuration (default sats, comment, quick zap)
 * - WebLN provider management
 */

import { atom } from 'jotai'
import storage from '@/services/local-storage.service'
import { WebLNProvider, GetInfoResponse } from '@webbtc/webln-types'

// ============================================================================
// Wallet Connection Atoms
// ============================================================================

/**
 * Whether wallet is connected
 */
export const isWalletConnectedAtom = atom<boolean>(false)

/**
 * WebLN provider instance
 */
export const walletProviderAtom = atom<WebLNProvider | null>(null)

/**
 * Wallet info from getInfo()
 */
export const walletInfoAtom = atom<GetInfoResponse | null>(null)

// ============================================================================
// Zap Configuration Atoms
// ============================================================================

/**
 * Default zap amount in sats
 */
export const defaultZapSatsAtom = atom<number>(storage.getDefaultZapSats())

/**
 * Default zap comment
 */
export const defaultZapCommentAtom = atom<string>(storage.getDefaultZapComment())

/**
 * Quick zap enabled (zap without confirmation)
 */
export const quickZapAtom = atom<boolean>(storage.getQuickZap())
