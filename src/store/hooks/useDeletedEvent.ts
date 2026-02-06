/**
 * Deleted Event Hook
 *
 * Provides functionality to:
 * - Track deleted events
 * - Check if an event has been deleted
 * - Add events to the deleted list
 */

import { useAtom } from 'jotai'
import { useCallback } from 'react'
import { NostrEvent } from 'nostr-tools'
import { deletedEventKeysAtom } from '@/store/atoms/content'
import { getReplaceableCoordinateFromEvent, isReplaceableEvent } from '@/lib/event'

/**
 * Get the unique key for an event
 * For replaceable events, use the coordinate (kind:pubkey:d-tag)
 * For regular events, use the event ID
 */
function getKey(event: NostrEvent): string {
  return isReplaceableEvent(event.kind) ? getReplaceableCoordinateFromEvent(event) : event.id
}

export function useDeletedEvent() {
  const [deletedEventKeys, setDeletedEventKeys] = useAtom(deletedEventKeysAtom)

  const isEventDeleted = useCallback(
    (event: NostrEvent) => {
      return deletedEventKeys.has(getKey(event))
    },
    [deletedEventKeys]
  )

  const addDeletedEvent = useCallback(
    (event: NostrEvent) => {
      setDeletedEventKeys((prev) => new Set(prev).add(getKey(event)))
    },
    [setDeletedEventKeys]
  )

  return {
    addDeletedEvent,
    isEventDeleted
  }
}
