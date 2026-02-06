import { Event as NEvent } from 'nostr-tools'
import {
  compareEvents,
  findInsertionIndex,
  insertSorted,
  insertManySorted,
  mergeSorted,
  updateSortedEvents
} from '../sorted-array-utils'

// Helper to create mock events
function createEvent(id: string, created_at: number): NEvent {
  return {
    id,
    pubkey: 'test-pubkey',
    created_at,
    kind: 1,
    tags: [],
    content: 'test',
    sig: 'test-sig'
  }
}

describe('sorted-array-utils', () => {
  describe('compareEvents', () => {
    it('should sort by created_at descending', () => {
      const older = createEvent('a', 100)
      const newer = createEvent('b', 200)

      expect(compareEvents(newer, older)).toBeLessThan(0)
      expect(compareEvents(older, newer)).toBeGreaterThan(0)
    })

    it('should use id as tiebreaker when timestamps are equal', () => {
      const eventA = createEvent('a', 100)
      const eventB = createEvent('b', 100)

      expect(compareEvents(eventA, eventB)).toBeLessThan(0)
      expect(compareEvents(eventB, eventA)).toBeGreaterThan(0)
    })

    it('should return 0 for identical events', () => {
      const event = createEvent('a', 100)
      expect(compareEvents(event, event)).toBe(0)
    })
  })

  describe('findInsertionIndex', () => {
    it('should find correct index in empty array', () => {
      const event = createEvent('a', 100)
      expect(findInsertionIndex([], event)).toBe(0)
    })

    it('should find correct index at start', () => {
      const arr = [createEvent('b', 100), createEvent('c', 50)]
      const event = createEvent('a', 200)
      expect(findInsertionIndex(arr, event)).toBe(0)
    })

    it('should find correct index at end', () => {
      const arr = [createEvent('b', 200), createEvent('c', 100)]
      const event = createEvent('a', 50)
      expect(findInsertionIndex(arr, event)).toBe(2)
    })

    it('should find correct index in middle', () => {
      const arr = [createEvent('a', 300), createEvent('c', 100)]
      const event = createEvent('b', 200)
      expect(findInsertionIndex(arr, event)).toBe(1)
    })
  })

  describe('insertSorted', () => {
    it('should insert into empty array', () => {
      const event = createEvent('a', 100)
      const result = insertSorted([], event)
      expect(result).toEqual([event])
    })

    it('should insert at correct position', () => {
      const e1 = createEvent('a', 300)
      const e2 = createEvent('c', 100)
      const arr = [e1, e2]
      const event = createEvent('b', 200)

      const result = insertSorted(arr, event)
      expect(result).toEqual([e1, event, e2])
    })

    it('should not modify original array', () => {
      const arr = [createEvent('a', 100)]
      const original = [...arr]
      insertSorted(arr, createEvent('b', 200))
      expect(arr).toEqual(original)
    })

    it('should skip duplicate events', () => {
      const event = createEvent('a', 100)
      const arr = [event]
      const result = insertSorted(arr, event)
      expect(result).toEqual([event])
      expect(result.length).toBe(1)
    })

    it('should respect limit', () => {
      const e1 = createEvent('a', 300)
      const e2 = createEvent('b', 200)
      const arr = [e1, e2]
      const event = createEvent('c', 100)

      const result = insertSorted(arr, event, 2)
      expect(result).toEqual([e1, e2])
      expect(result.length).toBe(2)
    })

    it('should not insert event beyond limit', () => {
      const e1 = createEvent('a', 300)
      const e2 = createEvent('b', 200)
      const arr = [e1, e2]
      const event = createEvent('c', 50)

      const result = insertSorted(arr, event, 2)
      expect(result).toEqual([e1, e2])
    })
  })

  describe('insertManySorted', () => {
    it('should handle empty existing array', () => {
      const events = [createEvent('a', 100), createEvent('b', 200)]
      const result = insertManySorted([], events)
      expect(result.length).toBe(2)
      expect(result[0].created_at).toBe(200)
      expect(result[1].created_at).toBe(100)
    })

    it('should handle empty new events', () => {
      const arr = [createEvent('a', 100)]
      const result = insertManySorted(arr, [])
      expect(result).toEqual(arr)
    })

    it('should insert multiple events correctly', () => {
      const e1 = createEvent('a', 400)
      const e2 = createEvent('d', 100)
      const arr = [e1, e2]

      const newEvents = [createEvent('b', 300), createEvent('c', 200)]
      const result = insertManySorted(arr, newEvents)

      expect(result.length).toBe(4)
      expect(result[0].created_at).toBe(400)
      expect(result[1].created_at).toBe(300)
      expect(result[2].created_at).toBe(200)
      expect(result[3].created_at).toBe(100)
    })

    it('should filter duplicates', () => {
      const e1 = createEvent('a', 100)
      const arr = [e1]
      const result = insertManySorted(arr, [e1, createEvent('b', 200)])
      expect(result.length).toBe(2)
    })

    it('should respect limit', () => {
      const arr = [createEvent('a', 100)]
      const newEvents = [createEvent('b', 300), createEvent('c', 200)]
      const result = insertManySorted(arr, newEvents, 2)
      expect(result.length).toBe(2)
      expect(result[0].created_at).toBe(300)
      expect(result[1].created_at).toBe(200)
    })
  })

  describe('mergeSorted', () => {
    it('should handle empty first array', () => {
      const arr2 = [createEvent('a', 100)]
      const result = mergeSorted([], arr2)
      expect(result).toEqual(arr2)
    })

    it('should handle empty second array', () => {
      const arr1 = [createEvent('a', 100)]
      const result = mergeSorted(arr1, [])
      expect(result).toEqual(arr1)
    })

    it('should merge two sorted arrays', () => {
      const arr1 = [createEvent('a', 400), createEvent('c', 200)]
      const arr2 = [createEvent('b', 300), createEvent('d', 100)]

      const result = mergeSorted(arr1, arr2)

      expect(result.length).toBe(4)
      expect(result[0].created_at).toBe(400)
      expect(result[1].created_at).toBe(300)
      expect(result[2].created_at).toBe(200)
      expect(result[3].created_at).toBe(100)
    })

    it('should remove duplicates', () => {
      const e1 = createEvent('a', 300)
      const e2 = createEvent('b', 100)
      const arr1 = [e1, e2]
      const arr2 = [e1, createEvent('c', 200)]

      const result = mergeSorted(arr1, arr2)
      expect(result.length).toBe(3)
    })

    it('should respect limit', () => {
      const arr1 = [createEvent('a', 400), createEvent('c', 200)]
      const arr2 = [createEvent('b', 300), createEvent('d', 100)]

      const result = mergeSorted(arr1, arr2, 2)
      expect(result.length).toBe(2)
      expect(result[0].created_at).toBe(400)
      expect(result[1].created_at).toBe(300)
    })
  })

  describe('updateSortedEvents', () => {
    it('should handle empty existing events', () => {
      const newEvents = [createEvent('a', 100)]
      const result = updateSortedEvents([], newEvents)
      expect(result).toEqual(newEvents)
    })

    it('should handle empty new events', () => {
      const existing = [createEvent('a', 100)]
      const result = updateSortedEvents(existing, [])
      expect(result).toEqual(existing)
    })

    it('should optimize when all new events are newer', () => {
      const existing = [createEvent('a', 100), createEvent('b', 50)]
      const newEvents = [createEvent('c', 300), createEvent('d', 200)]

      const result = updateSortedEvents(existing, newEvents)

      expect(result.length).toBe(4)
      expect(result[0].created_at).toBe(300)
      expect(result[1].created_at).toBe(200)
      expect(result[2].created_at).toBe(100)
      expect(result[3].created_at).toBe(50)
    })

    it('should merge when new events are mixed', () => {
      const existing = [createEvent('a', 300), createEvent('c', 100)]
      const newEvents = [createEvent('b', 200)]

      const result = updateSortedEvents(existing, newEvents)

      expect(result.length).toBe(3)
      expect(result[0].created_at).toBe(300)
      expect(result[1].created_at).toBe(200)
      expect(result[2].created_at).toBe(100)
    })

    it('should filter duplicates', () => {
      const e1 = createEvent('a', 100)
      const existing = [e1]
      const result = updateSortedEvents(existing, [e1])
      expect(result).toEqual([e1])
      expect(result.length).toBe(1)
    })

    it('should respect limit', () => {
      const existing = [createEvent('a', 100)]
      const newEvents = [createEvent('b', 300), createEvent('c', 200)]

      const result = updateSortedEvents(existing, newEvents, 2)
      expect(result.length).toBe(2)
      expect(result[0].created_at).toBe(300)
      expect(result[1].created_at).toBe(200)
    })
  })

  describe('performance characteristics', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) =>
        createEvent(`event-${i}`, 10000 - i)
      )

      const newEvent = createEvent('new', 5000)
      const start = performance.now()
      const result = insertSorted(largeArray, newEvent)
      const duration = performance.now() - start

      expect(result.length).toBe(1001)
      expect(duration).toBeLessThan(10) // Should be very fast with binary search
    })

    it('should merge large arrays efficiently', () => {
      const arr1 = Array.from({ length: 500 }, (_, i) => createEvent(`a-${i}`, 10000 - i * 2))
      const arr2 = Array.from({ length: 500 }, (_, i) => createEvent(`b-${i}`, 9999 - i * 2))

      const start = performance.now()
      const result = mergeSorted(arr1, arr2, 1000)
      const duration = performance.now() - start

      expect(result.length).toBe(1000)
      expect(duration).toBeLessThan(50) // Should be fast - linear merge
    })
  })
})
