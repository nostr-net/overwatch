/**
 * Mute List Hook
 *
 * Provides functionality to:
 * - Manage public and private mute lists
 * - Mute/unmute users publicly or privately
 * - Switch between public and private mutes
 * - Handles NIP-04 encryption/decryption
 */

import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Event } from 'nostr-tools'
import { z } from 'zod'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  publicMuteTagsAtom,
  privateMuteTagsAtom,
  muteChangingAtom
} from '@/store/atoms/content'
import { useNostr } from '@/providers/NostrProvider'
import { createMuteListDraftEvent } from '@/lib/draft-event'
import { getPubkeysFromPTags } from '@/lib/tag'
import client from '@/services/client.service'
import indexedDb from '@/services/indexed-db.service'

export function useMuteList() {
  const { t } = useTranslation()
  const {
    pubkey: accountPubkey,
    muteListEvent,
    publish,
    updateMuteListEvent,
    nip04Decrypt,
    nip04Encrypt
  } = useNostr()

  const [tags, setTags] = useAtom(publicMuteTagsAtom)
  const [privateTags, setPrivateTags] = useAtom(privateMuteTagsAtom)
  const [changing, setChanging] = useAtom(muteChangingAtom)

  // Derived sets
  const publicMutePubkeySet = useMemo(() => new Set(getPubkeysFromPTags(tags)), [tags])
  const privateMutePubkeySet = useMemo(
    () => new Set(getPubkeysFromPTags(privateTags)),
    [privateTags]
  )
  const mutePubkeySet = useMemo(() => {
    return new Set([...Array.from(privateMutePubkeySet), ...Array.from(publicMutePubkeySet)])
  }, [publicMutePubkeySet, privateMutePubkeySet])

  // Helper: Get private tags from mute list event
  const getPrivateTags = useCallback(
    async (muteListEvent: Event) => {
      if (!muteListEvent.content) return []

      const storedDecryptedTags = await indexedDb.getMuteDecryptedTags(muteListEvent.id)

      if (storedDecryptedTags) {
        return storedDecryptedTags
      } else {
        try {
          const plainText = await nip04Decrypt(muteListEvent.pubkey, muteListEvent.content)
          const privateTags = z.array(z.array(z.string())).parse(JSON.parse(plainText))
          await indexedDb.putMuteDecryptedTags(muteListEvent.id, privateTags)
          return privateTags
        } catch (error) {
          console.error('Failed to decrypt mute list content', error)
          return []
        }
      }
    },
    [nip04Decrypt]
  )

  // Sync tags with mute list event
  useEffect(() => {
    const updateMuteTags = async () => {
      if (!muteListEvent) {
        setTags([])
        setPrivateTags([])
        return
      }

      const privateTags = await getPrivateTags(muteListEvent).catch(() => {
        return []
      })
      setPrivateTags(privateTags)
      setTags(muteListEvent.tags)
    }
    updateMuteTags()
  }, [muteListEvent, getPrivateTags, setTags, setPrivateTags])

  const getMutePubkeys = useCallback(() => {
    return Array.from(mutePubkeySet)
  }, [mutePubkeySet])

  const getMuteType = useCallback(
    (pubkey: string): 'public' | 'private' | null => {
      if (publicMutePubkeySet.has(pubkey)) return 'public'
      if (privateMutePubkeySet.has(pubkey)) return 'private'
      return null
    },
    [publicMutePubkeySet, privateMutePubkeySet]
  )

  const publishNewMuteListEvent = useCallback(
    async (tags: string[][], content?: string) => {
      if (dayjs().unix() === muteListEvent?.created_at) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      const newMuteListDraftEvent = createMuteListDraftEvent(tags, content)
      const event = await publish(newMuteListDraftEvent)
      toast.success(t('Successfully updated mute list'))
      return event
    },
    [muteListEvent, publish, t]
  )

  const checkMuteListEvent = useCallback(
    (muteListEvent: Event | null) => {
      if (!muteListEvent) {
        const result = confirm(t('MuteListNotFoundConfirmation'))

        if (!result) {
          throw new Error('Mute list not found')
        }
      }
    },
    [t]
  )

  const mutePubkeyPublicly = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey || changing) return

      setChanging(true)
      try {
        const muteListEvent = await client.fetchMuteListEvent(accountPubkey)
        checkMuteListEvent(muteListEvent)
        if (
          muteListEvent &&
          muteListEvent.tags.some(([tagName, tagValue]) => tagName === 'p' && tagValue === pubkey)
        ) {
          return
        }
        const newTags = (muteListEvent?.tags ?? []).concat([['p', pubkey]])
        const newMuteListEvent = await publishNewMuteListEvent(newTags, muteListEvent?.content)
        const privateTags = await getPrivateTags(newMuteListEvent)
        await updateMuteListEvent(newMuteListEvent, privateTags)
      } catch (error) {
        toast.error(t('Failed to mute user publicly') + ': ' + (error as Error).message)
      } finally {
        setChanging(false)
      }
    },
    [accountPubkey, changing, setChanging, checkMuteListEvent, publishNewMuteListEvent, getPrivateTags, updateMuteListEvent, t]
  )

  const mutePubkeyPrivately = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey || changing) return

      setChanging(true)
      try {
        const muteListEvent = await client.fetchMuteListEvent(accountPubkey)
        checkMuteListEvent(muteListEvent)
        const privateTags = muteListEvent ? await getPrivateTags(muteListEvent) : []
        if (privateTags.some(([tagName, tagValue]) => tagName === 'p' && tagValue === pubkey)) {
          return
        }

        const newPrivateTags = privateTags.concat([['p', pubkey]])
        const cipherText = await nip04Encrypt(accountPubkey, JSON.stringify(newPrivateTags))
        const newMuteListEvent = await publishNewMuteListEvent(muteListEvent?.tags ?? [], cipherText)
        await updateMuteListEvent(newMuteListEvent, newPrivateTags)
      } catch (error) {
        toast.error(t('Failed to mute user privately') + ': ' + (error as Error).message)
      } finally {
        setChanging(false)
      }
    },
    [accountPubkey, changing, setChanging, checkMuteListEvent, getPrivateTags, nip04Encrypt, publishNewMuteListEvent, updateMuteListEvent, t]
  )

  const unmutePubkey = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey || changing) return

      setChanging(true)
      try {
        const muteListEvent = await client.fetchMuteListEvent(accountPubkey)
        if (!muteListEvent) return

        const privateTags = await getPrivateTags(muteListEvent)
        const newPrivateTags = privateTags.filter((tag) => tag[0] !== 'p' || tag[1] !== pubkey)
        let cipherText = muteListEvent.content
        if (newPrivateTags.length !== privateTags.length) {
          cipherText = await nip04Encrypt(accountPubkey, JSON.stringify(newPrivateTags))
        }

        const newMuteListEvent = await publishNewMuteListEvent(
          muteListEvent.tags.filter((tag) => tag[0] !== 'p' || tag[1] !== pubkey),
          cipherText
        )
        await updateMuteListEvent(newMuteListEvent, newPrivateTags)
      } finally {
        setChanging(false)
      }
    },
    [accountPubkey, changing, setChanging, getPrivateTags, nip04Encrypt, publishNewMuteListEvent, updateMuteListEvent]
  )

  const switchToPublicMute = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey || changing) return

      setChanging(true)
      try {
        const muteListEvent = await client.fetchMuteListEvent(accountPubkey)
        if (!muteListEvent) return

        const privateTags = await getPrivateTags(muteListEvent)
        const newPrivateTags = privateTags.filter((tag) => tag[0] !== 'p' || tag[1] !== pubkey)
        if (newPrivateTags.length === privateTags.length) {
          return
        }

        const cipherText = await nip04Encrypt(accountPubkey, JSON.stringify(newPrivateTags))
        const newMuteListEvent = await publishNewMuteListEvent(
          muteListEvent.tags
            .filter((tag) => tag[0] !== 'p' || tag[1] !== pubkey)
            .concat([['p', pubkey]]),
          cipherText
        )
        await updateMuteListEvent(newMuteListEvent, newPrivateTags)
      } finally {
        setChanging(false)
      }
    },
    [accountPubkey, changing, setChanging, getPrivateTags, nip04Encrypt, publishNewMuteListEvent, updateMuteListEvent]
  )

  const switchToPrivateMute = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey || changing) return

      setChanging(true)
      try {
        const muteListEvent = await client.fetchMuteListEvent(accountPubkey)
        if (!muteListEvent) return

        const newTags = muteListEvent.tags.filter((tag) => tag[0] !== 'p' || tag[1] !== pubkey)
        if (newTags.length === muteListEvent.tags.length) {
          return
        }

        const privateTags = await getPrivateTags(muteListEvent)
        const newPrivateTags = privateTags
          .filter((tag) => tag[0] !== 'p' || tag[1] !== pubkey)
          .concat([['p', pubkey]])
        const cipherText = await nip04Encrypt(accountPubkey, JSON.stringify(newPrivateTags))
        const newMuteListEvent = await publishNewMuteListEvent(newTags, cipherText)
        await updateMuteListEvent(newMuteListEvent, newPrivateTags)
      } finally {
        setChanging(false)
      }
    },
    [accountPubkey, changing, setChanging, getPrivateTags, nip04Encrypt, publishNewMuteListEvent, updateMuteListEvent]
  )

  return {
    mutePubkeySet,
    changing,
    getMutePubkeys,
    getMuteType,
    mutePubkeyPublicly,
    mutePubkeyPrivately,
    unmutePubkey,
    switchToPublicMute,
    switchToPrivateMute
  }
}
