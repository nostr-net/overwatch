/**
 * Nostr Publishing Hook
 *
 * This hook provides event publishing functionality:
 * - Event signing
 * - Event publishing
 * - Event deletion
 * - HTTP auth signing
 * - NIP-04 encryption/decryption
 */

import { useAtomValue } from 'jotai'
import { currentAccountAtom, signerAtom, profileAtom } from '../atoms/nostr'
import { TDraftEvent, TPublishOptions } from '@/types'
import { minePow } from '@/lib/event'
import { kinds, VerifiedEvent, Event } from 'nostr-tools'
import client from '@/services/client.service'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createDeletionRequestDraftEvent } from '@/lib/draft-event'
import { isProtectedEvent } from '@/lib/event'
import dayjs from 'dayjs'

export function useNostrPublishing() {
  const { t } = useTranslation()
  const account = useAtomValue(currentAccountAtom)
  const signer = useAtomValue(signerAtom)
  const profile = useAtomValue(profileAtom)

  const signEvent = async (draftEvent: TDraftEvent) => {
    const event = await signer?.signEvent(draftEvent)
    if (!event) {
      throw new Error('sign event failed')
    }
    return event as VerifiedEvent
  }

  const publish = async (
    draftEvent: TDraftEvent,
    { minPow = 0, ...options }: TPublishOptions = {}
  ) => {
    if (!account || !signer || account.signerType === 'npub') {
      throw new Error('You need to login first')
    }

    const draft = JSON.parse(JSON.stringify(draftEvent)) as TDraftEvent
    let event: VerifiedEvent
    if (minPow > 0) {
      const unsignedEvent = await minePow({ ...draft, pubkey: account.pubkey }, minPow)
      event = await signEvent(unsignedEvent)
    } else {
      event = await signEvent(draft)
    }

    if (event.kind !== kinds.Application && event.pubkey !== account.pubkey) {
      const eventAuthor = await client.fetchProfile(event.pubkey)
      const result = confirm(
        t(
          'You are about to publish an event signed by [{{eventAuthorName}}]. You are currently logged in as [{{currentUsername}}]. Are you sure?',
          { eventAuthorName: eventAuthor?.username, currentUsername: profile?.username }
        )
      )
      if (!result) {
        throw new Error(t('Cancelled'))
      }
    }

    const relays = await client.determineTargetRelays(event, options)
    await client.publishEvent(relays, event)
    return event
  }

  const attemptDelete = async (targetEvent: Event, addDeletedEvent: (event: Event) => void) => {
    if (!signer) {
      throw new Error(t('You need to login first'))
    }
    if (account?.pubkey !== targetEvent.pubkey) {
      throw new Error(t('You can only delete your own notes'))
    }

    const deletionRequest = await signEvent(createDeletionRequestDraftEvent(targetEvent))

    const seenOn = client.getSeenEventRelayUrls(targetEvent.id)
    const relays = await client.determineTargetRelays(targetEvent, {
      specifiedRelayUrls: isProtectedEvent(targetEvent) ? seenOn : undefined,
      additionalRelayUrls: seenOn
    })

    await client.publishEvent(relays, deletionRequest)
    addDeletedEvent(targetEvent)
    toast.success(t('Deletion request sent to {{count}} relays', { count: relays.length }))
  }

  const signHttpAuth = async (url: string, method: string, content = '') => {
    const event = await signEvent({
      content,
      kind: kinds.HTTPAuth,
      created_at: dayjs().unix(),
      tags: [
        ['u', url],
        ['method', method]
      ]
    })
    return 'Nostr ' + btoa(JSON.stringify(event))
  }

  const nip04Encrypt = async (pubkey: string, plainText: string) => {
    return signer?.nip04Encrypt(pubkey, plainText) ?? ''
  }

  const nip04Decrypt = async (pubkey: string, cipherText: string) => {
    return signer?.nip04Decrypt(pubkey, cipherText) ?? ''
  }

  return {
    signEvent,
    publish,
    attemptDelete,
    signHttpAuth,
    nip04Encrypt,
    nip04Decrypt
  }
}
