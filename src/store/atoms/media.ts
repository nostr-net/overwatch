/**
 * Media Upload Service Domain Atoms
 *
 * This file contains atoms for:
 * - Media upload service configuration
 * - Upload service selection
 */

import { atom } from 'jotai'
import storage from '@/services/local-storage.service'
import { TMediaUploadServiceConfig } from '@/types'

// ============================================================================
// Media Upload Service Atoms
// ============================================================================

/**
 * Media upload service configuration
 */
export const mediaUploadServiceConfigAtom = atom<TMediaUploadServiceConfig>(
  storage.getMediaUploadServiceConfig()
)
