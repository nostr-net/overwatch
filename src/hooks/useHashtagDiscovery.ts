import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { LOCKED_RELAY } from '@/constants'
import client from '@/services/client.service'
import { channelsAtom } from '@/providers/ChannelProvider'
import { dismissedHashtagsAtom } from '@/providers/ChannelProvider'
import type { TChannel } from '@/types/channel'

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useHashtagDiscovery() {
  const [, setChannels] = useAtom(channelsAtom)
  const [dismissedHashtags] = useAtom(dismissedHashtagsAtom)
  const hashtagCountsRef = useRef<Map<string, number>>(new Map())
  const hashtagLatestRef = useRef<Map<string, number>>(new Map())
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eosedRef = useRef(false)
  const dismissedRef = useRef(dismissedHashtags)

  useEffect(() => {
    dismissedRef.current = dismissedHashtags
  }, [dismissedHashtags])

  useEffect(() => {
    if (!LOCKED_RELAY) return

    eosedRef.current = false
    hashtagCountsRef.current.clear()
    hashtagLatestRef.current.clear()

    const syncChannels = () => {
      const counts = hashtagCountsRef.current
      if (counts.size === 0) return

      setChannels((prev) => {
        const dismissed = dismissedRef.current

        // Build set of all hashtags already covered by existing channels
        const existingHashtags = new Set<string>()
        for (const ch of prev) {
          for (const tag of ch.hashtags) {
            existingHashtags.add(tag.toLowerCase())
          }
        }

        // Update eventCount on existing auto-discovered channels
        const updated = prev.map((ch) => {
          if (!ch.autoDiscovered) return ch
          const tag = ch.hashtags[0]?.toLowerCase()
          const count = tag ? counts.get(tag) : undefined
          if (count !== undefined && count !== ch.eventCount) {
            return { ...ch, eventCount: count }
          }
          return ch
        })

        // Build new channels for undiscovered hashtags
        // Re-discover dismissed hashtags if new messages appeared after dismissal
        const newChannels: TChannel[] = []
        for (const [hashtag, count] of counts) {
          const normalized = hashtag.toLowerCase()
          if (existingHashtags.has(normalized)) {
            continue
          }

          const dismissedAt = dismissed[normalized]
          if (dismissedAt !== undefined) {
            const latestEvent = hashtagLatestRef.current.get(normalized) || 0
            if (latestEvent <= dismissedAt) {
              continue
            }
          }

          newChannels.push({
            id: generateUUID(),
            name: normalized,
            hashtags: [normalized],
            relayUrls: [LOCKED_RELAY],
            created_at: Date.now(),
            updated_at: Date.now(),
            order: prev.length + newChannels.length,
            lastReadAt: Date.now(),
            autoDiscovered: true,
            eventCount: count
          })

          // Prevent duplicates within this batch
          existingHashtags.add(normalized)
        }

        if (newChannels.length > 0) {
          return [...updated, ...newChannels]
        }

        const hasChanges = updated.some((ch, i) => ch !== prev[i])
        return hasChanges ? updated : prev
      })
    }

    const debouncedSync = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(syncChannels, 2000)
    }

    const sub = client.subscribe(
      [LOCKED_RELAY],
      { kinds: [1, 42], limit: 500 },
      {
        onevent: (event) => {
          const tags = event.tags.filter((t) => t[0] === 't' && t[1])
          for (const tag of tags) {
            const hashtag = tag[1].toLowerCase()
            const current = hashtagCountsRef.current.get(hashtag) || 0
            hashtagCountsRef.current.set(hashtag, current + 1)

            const prevLatest = hashtagLatestRef.current.get(hashtag) || 0
            if (event.created_at > prevLatest) {
              hashtagLatestRef.current.set(hashtag, event.created_at)
            }
          }

          // After EOSE, debounce new hashtag syncing
          if (eosedRef.current && tags.length > 0) {
            debouncedSync()
          }
        },
        oneose: (eosed) => {
          if (eosed) {
            eosedRef.current = true
            syncChannels()
          }
        }
      }
    )

    return () => {
      sub.close()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [setChannels])
}
