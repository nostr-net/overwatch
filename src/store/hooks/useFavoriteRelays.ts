/**
 * Favorite Relays Hook
 *
 * Provides functionality to manage favorite relays and relay sets
 */

import { useAtom } from 'jotai'
import { useEffect, useCallback } from 'react'
import { Event, kinds } from 'nostr-tools'
import {
  favoriteRelaysAtom,
  relaySetEventsAtom,
  relaySetsAtom
} from '@/store/atoms/content'
import { useNostr } from '@/providers/NostrProvider'
import { getStoredInitialRelays } from '@/components/RelaySelectionDialog'
import { BIG_RELAY_URLS, DEFAULT_FAVORITE_RELAYS } from '@/constants'
import { createFavoriteRelaysDraftEvent, createRelaySetDraftEvent } from '@/lib/draft-event'
import { getReplaceableEventIdentifier } from '@/lib/event'
import { getRelaySetFromEvent } from '@/lib/event-metadata'
import { randomString } from '@/lib/random'
import { isWebsocketUrl, normalizeUrl } from '@/lib/url'
import client from '@/services/client.service'
import indexedDb from '@/services/indexed-db.service'
import type { TRelaySet } from '@/types'

export function useFavoriteRelays() {
  const { favoriteRelaysEvent, updateFavoriteRelaysEvent, pubkey, relayList, publish } = useNostr()
  const [favoriteRelays, setFavoriteRelays] = useAtom(favoriteRelaysAtom)
  const [relaySetEvents, setRelaySetEvents] = useAtom(relaySetEventsAtom)
  const [relaySets, setRelaySets] = useAtom(relaySetsAtom)

  // Initialize favorite relays from event
  useEffect(() => {
    if (!favoriteRelaysEvent) {
      // Check for initial relays selected by the user (when not logged in)
      const initialRelays = getStoredInitialRelays()
      if (initialRelays && initialRelays.length > 0) {
        setFavoriteRelays(initialRelays)
      } else {
        setFavoriteRelays(DEFAULT_FAVORITE_RELAYS)
      }
      setRelaySetEvents([])
      return
    }

    const init = async () => {
      const relays: string[] = []
      const relaySetIds: string[] = []

      favoriteRelaysEvent.tags.forEach(([tagName, tagValue]) => {
        if (!tagValue) return

        if (tagName === 'relay') {
          const normalizedUrl = normalizeUrl(tagValue)
          if (normalizedUrl && !relays.includes(normalizedUrl)) {
            relays.push(normalizedUrl)
          }
        } else if (tagName === 'a') {
          const [kind, author, relaySetId] = tagValue.split(':')
          if (kind !== kinds.Relaysets.toString()) return
          if (!pubkey || author !== pubkey) return // TODO: support others relay sets
          if (!relaySetId) return

          if (!relaySetIds.includes(relaySetId)) {
            relaySetIds.push(relaySetId)
          }
        }
      })

      setFavoriteRelays(relays)

      if (!pubkey || !relaySetIds.length) {
        setRelaySets([])
        return
      }
      const storedRelaySetEvents = await Promise.all(
        relaySetIds.map((id) => indexedDb.getReplaceableEvent(pubkey, kinds.Relaysets, id))
      )
      setRelaySetEvents(storedRelaySetEvents.filter(Boolean) as Event[])

      const newRelaySetEvents = await client.fetchEvents(
        (relayList?.write ?? []).concat(BIG_RELAY_URLS).slice(0, 5),
        {
          kinds: [kinds.Relaysets],
          authors: [pubkey],
          '#d': relaySetIds
        }
      )
      const relaySetEventMap = new Map<string, Event>()
      newRelaySetEvents.forEach((event) => {
        const d = getReplaceableEventIdentifier(event)
        if (!d) return

        const old = relaySetEventMap.get(d)
        if (!old || old.created_at < event.created_at) {
          relaySetEventMap.set(d, event)
        }
      })
      const uniqueNewRelaySetEvents = relaySetIds
        .map((id, index) => {
          const event = relaySetEventMap.get(id)
          if (event) {
            return event
          }
          return storedRelaySetEvents[index] || null
        })
        .filter(Boolean) as Event[]
      setRelaySetEvents(uniqueNewRelaySetEvents)
      await Promise.all(
        uniqueNewRelaySetEvents.map((event) => {
          return indexedDb.putReplaceableEvent(event)
        })
      )
    }
    init()
  }, [favoriteRelaysEvent, pubkey, relayList, setFavoriteRelays, setRelaySetEvents, setRelaySets])

  // Derive relay sets from relay set events
  useEffect(() => {
    setRelaySets(
      relaySetEvents.map((evt) => getRelaySetFromEvent(evt)).filter(Boolean) as TRelaySet[]
    )
  }, [relaySetEvents, setRelaySets])

  const addFavoriteRelays = useCallback(
    async (relayUrls: string[]) => {
      const normalizedUrls = relayUrls
        .map((relayUrl) => normalizeUrl(relayUrl))
        .filter((url) => !!url && !favoriteRelays.includes(url))
      if (!normalizedUrls.length) return

      const draftEvent = createFavoriteRelaysDraftEvent(
        [...favoriteRelays, ...normalizedUrls],
        relaySetEvents
      )
      const newFavoriteRelaysEvent = await publish(draftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [favoriteRelays, relaySetEvents, publish, updateFavoriteRelaysEvent]
  )

  const deleteFavoriteRelays = useCallback(
    async (relayUrls: string[]) => {
      const normalizedUrls = relayUrls
        .map((relayUrl) => normalizeUrl(relayUrl))
        .filter((url) => !!url && favoriteRelays.includes(url))
      if (!normalizedUrls.length) return

      const draftEvent = createFavoriteRelaysDraftEvent(
        favoriteRelays.filter((url) => !normalizedUrls.includes(url)),
        relaySetEvents
      )
      const newFavoriteRelaysEvent = await publish(draftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [favoriteRelays, relaySetEvents, publish, updateFavoriteRelaysEvent]
  )

  const createRelaySet = useCallback(
    async (relaySetName: string, relayUrls: string[] = []) => {
      const normalizedUrls = relayUrls
        .map((url) => normalizeUrl(url))
        .filter((url) => isWebsocketUrl(url))
      const id = randomString()
      const relaySetDraftEvent = createRelaySetDraftEvent({
        id,
        name: relaySetName,
        relayUrls: normalizedUrls
      })
      const newRelaySetEvent = await publish(relaySetDraftEvent)
      await indexedDb.putReplaceableEvent(newRelaySetEvent)

      const favoriteRelaysDraftEvent = createFavoriteRelaysDraftEvent(favoriteRelays, [
        ...relaySetEvents,
        newRelaySetEvent
      ])
      const newFavoriteRelaysEvent = await publish(favoriteRelaysDraftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [favoriteRelays, relaySetEvents, publish, updateFavoriteRelaysEvent]
  )

  const addRelaySets = useCallback(
    async (newRelaySetEvents: Event[]) => {
      const favoriteRelaysDraftEvent = createFavoriteRelaysDraftEvent(favoriteRelays, [
        ...relaySetEvents,
        ...newRelaySetEvents
      ])
      const newFavoriteRelaysEvent = await publish(favoriteRelaysDraftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [favoriteRelays, relaySetEvents, publish, updateFavoriteRelaysEvent]
  )

  const deleteRelaySet = useCallback(
    async (id: string) => {
      const newRelaySetEvents = relaySetEvents.filter((event) => {
        return getReplaceableEventIdentifier(event) !== id
      })
      if (newRelaySetEvents.length === relaySetEvents.length) return

      const draftEvent = createFavoriteRelaysDraftEvent(favoriteRelays, newRelaySetEvents)
      const newFavoriteRelaysEvent = await publish(draftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [favoriteRelays, relaySetEvents, publish, updateFavoriteRelaysEvent]
  )

  const updateRelaySet = useCallback(
    async (newSet: TRelaySet) => {
      const draftEvent = createRelaySetDraftEvent(newSet)
      const newRelaySetEvent = await publish(draftEvent)
      await indexedDb.putReplaceableEvent(newRelaySetEvent)

      setRelaySetEvents((prev) => {
        return prev.map((event) => {
          if (getReplaceableEventIdentifier(event) === newSet.id) {
            return newRelaySetEvent
          }
          return event
        })
      })
    },
    [publish, setRelaySetEvents]
  )

  const reorderFavoriteRelays = useCallback(
    async (reorderedRelays: string[]) => {
      setFavoriteRelays(reorderedRelays)
      const draftEvent = createFavoriteRelaysDraftEvent(reorderedRelays, relaySetEvents)
      const newFavoriteRelaysEvent = await publish(draftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [relaySetEvents, publish, updateFavoriteRelaysEvent, setFavoriteRelays]
  )

  const reorderRelaySets = useCallback(
    async (reorderedSets: TRelaySet[]) => {
      setRelaySets(reorderedSets)
      const draftEvent = createFavoriteRelaysDraftEvent(
        favoriteRelays,
        reorderedSets.map((set) => set.aTag)
      )
      const newFavoriteRelaysEvent = await publish(draftEvent)
      updateFavoriteRelaysEvent(newFavoriteRelaysEvent)
    },
    [favoriteRelays, publish, updateFavoriteRelaysEvent, setRelaySets]
  )

  return {
    favoriteRelays,
    addFavoriteRelays,
    deleteFavoriteRelays,
    reorderFavoriteRelays,
    relaySets,
    createRelaySet,
    addRelaySets,
    deleteRelaySet,
    updateRelaySet,
    reorderRelaySets
  }
}
