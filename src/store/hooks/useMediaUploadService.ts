/**
 * Media Upload Service Hook
 *
 * Media upload service configuration
 */

import { useAtom } from 'jotai'
import { mediaUploadServiceConfigAtom } from '../atoms/media'
import { TMediaUploadServiceConfig } from '@/types'
import storage from '@/services/local-storage.service'

export function useMediaUploadService() {
  const [serviceConfig, setServiceConfig] = useAtom(mediaUploadServiceConfigAtom)

  const updateServiceConfig = (newConfig: TMediaUploadServiceConfig, pubkey: string | null) => {
    if (!pubkey) {
      return
    }
    setServiceConfig(newConfig)
    storage.setMediaUploadServiceConfig(pubkey, newConfig)
  }

  return {
    serviceConfig,
    updateServiceConfig,
    setServiceConfig
  }
}
