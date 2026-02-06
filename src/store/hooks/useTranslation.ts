/**
 * Translation Service Hook
 *
 * Translation service configuration and caching
 */

import { useAtom } from 'jotai'
import {
  translationConfigAtom,
  translatedEventIdSetAtom,
  translatedEventCacheAtom,
  translatedTextCacheAtom
} from '../atoms/translation'
import { TTranslationServiceConfig } from '@/types'
import storage from '@/services/local-storage.service'

export function useTranslationService() {
  const [config, setConfig] = useAtom(translationConfigAtom)
  const [translatedEventIdSet, setTranslatedEventIdSet] = useAtom(translatedEventIdSetAtom)
  const translatedEventCache = translatedEventCacheAtom
  const translatedTextCache = translatedTextCacheAtom

  const updateConfig = (newConfig: TTranslationServiceConfig, pubkey: string | null) => {
    setConfig(newConfig)
    storage.setTranslationServiceConfig(newConfig, pubkey)
  }

  return {
    config,
    translatedEventIdSet,
    translatedEventCache,
    translatedTextCache,
    updateConfig,
    setConfig,
    setTranslatedEventIdSet
  }
}
