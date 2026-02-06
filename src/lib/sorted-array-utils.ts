import { Event as NEvent } from 'nostr-tools'

/**
 * Sorted Array Utilities for Nostr Events
 *
 * These utilities maintain arrays sorted by created_at (descending) and id (ascending as tiebreaker).
 * This avoids O(n log n) sorts in hot paths by maintaining sorted order incrementally.
 *
 * Event ordering: newer events first (higher created_at), with id as tiebreaker for same timestamp
 */

/**
 * Comparison function for Nostr events
 * Returns: < 0 if a should come before b, > 0 if a should come after b, 0 if equal
 */
export function compareEvents(a: NEvent, b: NEvent): number {
  // Sort by created_at descending (newer first)
  if (a.created_at !== b.created_at) {
    return b.created_at - a.created_at
  }
  // If timestamps are equal, sort by id ascending (lexicographically)
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * Binary search to find insertion index for an event in a sorted array
 * @param arr Sorted array of events (descending by created_at)
 * @param event Event to insert
 * @returns Index where event should be inserted
 */
export function findInsertionIndex(arr: NEvent[], event: NEvent): number {
  let left = 0
  let right = arr.length

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    if (compareEvents(event, arr[mid]) < 0) {
      right = mid
    } else {
      left = mid + 1
    }
  }

  return left
}

/**
 * Insert a single event into a sorted array while maintaining sort order
 * @param arr Sorted array of events (descending by created_at)
 * @param event Event to insert
 * @param limit Maximum array size (undefined for no limit)
 * @returns New sorted array with event inserted (original array is not modified)
 */
export function insertSorted(arr: NEvent[], event: NEvent, limit?: number): NEvent[] {
  // Check if event already exists
  const existingIndex = arr.findIndex(e => e.id === event.id)
  if (existingIndex !== -1) {
    return arr // Event already exists, no need to insert
  }

  // Find insertion point using binary search
  const insertIndex = findInsertionIndex(arr, event)

  // If limit is set and event would be inserted beyond the limit, ignore it
  if (limit !== undefined && insertIndex >= limit) {
    return arr
  }

  // Create new array with event inserted
  const newArr = [...arr.slice(0, insertIndex), event, ...arr.slice(insertIndex)]

  // Apply limit if specified
  if (limit !== undefined && newArr.length > limit) {
    return newArr.slice(0, limit)
  }

  return newArr
}

/**
 * Insert multiple events into a sorted array while maintaining sort order
 * More efficient than calling insertSorted multiple times
 * @param arr Sorted array of events (descending by created_at)
 * @param events Events to insert
 * @param limit Maximum array size (undefined for no limit)
 * @returns New sorted array with events inserted
 */
export function insertManySorted(arr: NEvent[], events: NEvent[], limit?: number): NEvent[] {
  if (events.length === 0) return arr
  if (arr.length === 0) {
    const sorted = [...events].sort(compareEvents)
    return limit !== undefined ? sorted.slice(0, limit) : sorted
  }

  // Create a Set of existing event IDs for O(1) lookup
  const existingIds = new Set(arr.map(e => e.id))

  // Filter out duplicates
  const newEvents = events.filter(e => !existingIds.has(e.id))

  if (newEvents.length === 0) return arr

  // For small number of new events, use individual insertion
  if (newEvents.length <= 5) {
    let result = arr
    for (const event of newEvents) {
      result = insertSorted(result, event, limit)
    }
    return result
  }

  // For larger batches, merge sorted arrays
  const sortedNewEvents = [...newEvents].sort(compareEvents)
  return mergeSorted(arr, sortedNewEvents, limit)
}

/**
 * Merge two sorted arrays of events while maintaining sort order
 * @param arr1 First sorted array (descending by created_at)
 * @param arr2 Second sorted array (descending by created_at)
 * @param limit Maximum result size (undefined for no limit)
 * @returns New merged sorted array
 */
export function mergeSorted(arr1: NEvent[], arr2: NEvent[], limit?: number): NEvent[] {
  if (arr1.length === 0) {
    return limit !== undefined ? arr2.slice(0, limit) : arr2
  }
  if (arr2.length === 0) {
    return limit !== undefined ? arr1.slice(0, limit) : arr1
  }

  const result: NEvent[] = []
  const seen = new Set<string>()
  let i = 0
  let j = 0
  const maxLength = limit ?? arr1.length + arr2.length

  while (result.length < maxLength && (i < arr1.length || j < arr2.length)) {
    let nextEvent: NEvent

    if (i >= arr1.length) {
      nextEvent = arr2[j++]
    } else if (j >= arr2.length) {
      nextEvent = arr1[i++]
    } else {
      const cmp = compareEvents(arr1[i], arr2[j])
      if (cmp <= 0) {
        nextEvent = arr1[i++]
      } else {
        nextEvent = arr2[j++]
      }
    }

    // Skip duplicates
    if (!seen.has(nextEvent.id)) {
      seen.add(nextEvent.id)
      result.push(nextEvent)
    }
  }

  return result
}

/**
 * Efficiently update a sorted array with new events
 * Optimized for the common case where new events are newer than existing ones
 * @param existingEvents Sorted array of existing events
 * @param newEvents Array of new events (may not be sorted)
 * @param limit Maximum result size
 * @returns New sorted array with events merged
 */
export function updateSortedEvents(
  existingEvents: NEvent[],
  newEvents: NEvent[],
  limit?: number
): NEvent[] {
  if (newEvents.length === 0) return existingEvents
  if (existingEvents.length === 0) {
    const sorted = [...newEvents].sort(compareEvents)
    return limit !== undefined ? sorted.slice(0, limit) : sorted
  }

  // Create a Set of existing event IDs for O(1) duplicate detection
  const existingIds = new Set(existingEvents.map(e => e.id))
  const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id))

  if (uniqueNewEvents.length === 0) return existingEvents

  // Sort new events
  const sortedNewEvents = [...uniqueNewEvents].sort(compareEvents)

  // Check if all new events are newer than all existing events
  const newestExisting = existingEvents[0]
  const oldestNew = sortedNewEvents[sortedNewEvents.length - 1]

  if (compareEvents(oldestNew, newestExisting) < 0) {
    // All new events are newer - simple concatenation
    const result = [...sortedNewEvents, ...existingEvents]
    return limit !== undefined ? result.slice(0, limit) : result
  }

  // Need to merge
  return mergeSorted(existingEvents, sortedNewEvents, limit)
}
