/**
 * TranslationServiceProvider v2 - Jotai-based Bridge Provider
 *
 * Backward compatible Context API provider using Jotai atoms
 */

import { ExtendedKind } from '@/constants'
import { getPollMetadataFromEvent } from '@/lib/event-metadata'
import libreTranslate from '@/services/libre-translate.service'
import storage from '@/services/local-storage.service'
import translation from '@/services/translation.service'
import { TTranslationAccount, TTranslationServiceConfig } from '@/types'
import { Event, kinds } from 'nostr-tools'
import { createContext, useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNostr } from './NostrProvider'
import { useTranslationService as useTranslationStore } from '@/store/hooks/useTranslation'
import { useAtom } from 'jotai'
import { translatedEventCacheAtom, translatedTextCacheAtom } from '@/store/atoms/translation'

type TTranslationServiceContext = {
  config: TTranslationServiceConfig
  translatedEventIdSet: Set<string>
  translateText: (text: string) => Promise<string>
  translateEvent: (event: Event) => Promise<Event | void>
  getTranslatedEvent: (eventId: string) => Event | null
  showOriginalEvent: (eventId: string) => void
  getAccount: () => Promise<TTranslationAccount | void>
  regenerateApiKey: () => Promise<string | undefined>
  updateConfig: (newConfig: TTranslationServiceConfig) => void
}

const TranslationServiceContext = createContext<TTranslationServiceContext | undefined>(undefined)

export const useTranslationService = () => {
  const context = useContext(TranslationServiceContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export function TranslationServiceProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const { pubkey, startLogin } = useNostr()
  const store = useTranslationStore()
  const [translatedEventCache, setTranslatedEventCache] = useAtom(translatedEventCacheAtom)
  const [translatedTextCache, setTranslatedTextCache] = useAtom(translatedTextCacheAtom)

  useEffect(() => {
    translation.changeCurrentPubkey(pubkey)
    const config = storage.getTranslationServiceConfig(pubkey)
    store.setConfig(config)
  }, [pubkey])

  const getAccount = async (): Promise<TTranslationAccount | void> => {
    if (store.config.service !== 'jumble') return
    if (!pubkey) {
      startLogin()
      return
    }
    return await translation.getAccount()
  }

  const regenerateApiKey = async (): Promise<string | undefined> => {
    if (store.config.service !== 'jumble') return
    if (!pubkey) {
      startLogin()
      return
    }
    return await translation.regenerateApiKey()
  }

  const getTranslatedEvent = (eventId: string): Event | null => {
    const target = i18n.language
    const cacheKey = target + '_' + eventId
    return translatedEventCache.get(cacheKey) ?? null
  }

  const translate = async (text: string, target: string): Promise<string> => {
    if (store.config.service === 'jumble') {
      return await translation.translate(text, target)
    } else {
      return await libreTranslate.translate(text, target, store.config.server, store.config.api_key)
    }
  }

  const translateText = async (text: string): Promise<string> => {
    if (!text) return text

    const target = i18n.language
    const cacheKey = target + '_' + text
    const cache = translatedTextCache.get(cacheKey)
    if (cache) return cache

    const translatedText = await translate(text, target)
    setTranslatedTextCache(new Map(translatedTextCache.set(cacheKey, translatedText)))
    return translatedText
  }

  const translateHighlightEvent = async (event: Event): Promise<Event> => {
    const target = i18n.language
    const comment = event.tags.find((tag) => tag[0] === 'comment')?.[1]

    const texts = {
      content: event.content,
      comment
    }
    const joinedText = joinTexts(texts)
    if (!joinedText) return event

    const translatedText = await translate(joinedText, target)
    const translatedTexts = splitTranslatedText(translatedText)
    return {
      ...event,
      content: translatedTexts.content ?? event.content,
      tags: event.tags.map((tag) =>
        tag[0] === 'comment' ? ['comment', translatedTexts.comment ?? tag[1]] : tag
      )
    }
  }

  const translatePollEvent = async (event: Event): Promise<Event> => {
    const target = i18n.language
    const pollMetadata = getPollMetadataFromEvent(event)

    const texts: Record<string, string> = {
      question: event.content,
      ...pollMetadata?.options.reduce(
        (acc, option) => {
          acc[option.id] = option.label
          return acc
        },
        {} as Record<string, string>
      )
    }
    const joinedText = joinTexts(texts)
    if (!joinedText) return event

    const translatedText = await translate(joinedText, target)
    const translatedTexts = splitTranslatedText(translatedText)
    return {
      ...event,
      content: translatedTexts.question ?? '',
      tags: event.tags.map((tag) =>
        tag[0] === 'option' ? ['option', tag[1], translatedTexts[tag[1]] ?? tag[2]] : tag
      )
    }
  }

  const translateEvent = async (event: Event): Promise<Event | void> => {
    if (store.config.service === 'jumble' && !pubkey) {
      startLogin()
      return
    }

    const target = i18n.language
    const cacheKey = target + '_' + event.id
    const cache = translatedEventCache.get(cacheKey)
    if (cache) {
      store.setTranslatedEventIdSet(new Set(store.translatedEventIdSet.add(event.id)))
      return cache
    }

    let translatedEvent: Event | undefined
    if (event.kind === kinds.Highlights) {
      translatedEvent = await translateHighlightEvent(event)
    } else if (event.kind === ExtendedKind.POLL) {
      translatedEvent = await translatePollEvent(event)
    } else {
      const translatedText = await translate(event.content, target)
      if (!translatedText) return
      translatedEvent = { ...event, content: translatedText }
    }

    setTranslatedEventCache(new Map(translatedEventCache.set(cacheKey, translatedEvent)))
    store.setTranslatedEventIdSet(new Set(store.translatedEventIdSet.add(event.id)))
    return translatedEvent
  }

  const showOriginalEvent = (eventId: string) => {
    const newSet = new Set(store.translatedEventIdSet)
    newSet.delete(eventId)
    store.setTranslatedEventIdSet(newSet)
  }

  const updateConfigWrapper = (newConfig: TTranslationServiceConfig) => {
    store.updateConfig(newConfig, pubkey)
  }

  return (
    <TranslationServiceContext.Provider
      value={{
        config: store.config,
        translatedEventIdSet: store.translatedEventIdSet,
        getAccount,
        regenerateApiKey,
        translateText,
        translateEvent,
        getTranslatedEvent,
        showOriginalEvent,
        updateConfig: updateConfigWrapper
      }}
    >
      {children}
    </TranslationServiceContext.Provider>
  )
}

function joinTexts(texts: Record<string, string | undefined>): string {
  return (
    Object.entries(texts).filter(([, content]) => content && content.trim() !== '') as [
      string,
      string
    ][]
  )
    .map(([key, content]) => `=== ${key} ===\n${content.trim()}\n=== ${key} ===`)
    .join('\n\n')
}

function splitTranslatedText(translated: string) {
  const regex = /=== (.+?) ===\n([\s\S]*?)\n=== \1 ===/g
  const results: Record<string, string | undefined> = {}

  let match: RegExpExecArray | null
  while ((match = regex.exec(translated)) !== null) {
    const key = match[1].trim()
    const content = match[2].trim()
    results[key] = content
  }

  return results
}
