// useChannelBackgroundSubscriptions Hook
// Purpose: Maintain background subscriptions to all channels for unread tracking

import { useEffect, useRef } from 'react'
import { TChannel } from '@/types/channel'
import { useFavoriteRelays } from '@/providers/FavoriteRelaysProvider'
import channelService from '@/services/channel.service'
import client from '@/services/client.service'

/**
 * Hook to maintain background subscriptions for all channels
 * This enables unread tracking even when not viewing a channel
 *
 * @param channels - All channels to subscribe to
 * @param activeChannelId - Currently active channel (already has subscription via NoteList)
 */
export function useChannelBackgroundSubscriptions(
  channels: TChannel[],
  activeChannelId: string | null
) {
  const { favoriteRelays } = useFavoriteRelays()
  const subscriptionsRef = useRef<Map<string, { close: () => void }>>(new Map())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const currentSubs = subscriptionsRef.current
    const channelIds = new Set(channels.map(c => c.id))

    // Close subscriptions for channels that no longer exist
    for (const [channelId, sub] of currentSubs.entries()) {
      if (!channelIds.has(channelId)) {
        console.log('[BackgroundSub] Closing subscription for removed channel:', channelId.slice(0, 8))
        sub.close()
        currentSubs.delete(channelId)
      }
    }

    // Create subscriptions for channels that don't have one
    // Skip the active channel since NoteList handles it
    for (const channel of channels) {
      if (channel.id === activeChannelId) {
        // Close any existing background sub for the active channel
        const existingSub = currentSubs.get(channel.id)
        if (existingSub) {
          console.log('[BackgroundSub] Closing background sub for now-active channel:', channel.id.slice(0, 8))
          existingSub.close()
          currentSubs.delete(channel.id)
        }
        continue
      }

      // Skip if already subscribed
      if (currentSubs.has(channel.id)) {
        continue
      }

      // Create new subscription
      const relayUrls = channelService.getEffectiveRelays(channel, favoriteRelays)
      if (relayUrls.length === 0) {
        console.log('[BackgroundSub] No relays for channel:', channel.name)
        continue
      }

      const filter = channelService.buildChannelFilter(channel, { limit: 50 })

      console.log('[BackgroundSub] Creating subscription for channel:', channel.name, channel.id.slice(0, 8))

      const sub = client.subscribe(
        relayUrls,
        filter,
        {
          onevent: (event) => {
            if (!mountedRef.current) return
            // Track event for unread calculation
            channelService.trackEventForUnread(channel.id, event.created_at)
          },
          oneose: (eosed) => {
            if (eosed) {
              console.log('[BackgroundSub] EOSE for channel:', channel.name, channel.id.slice(0, 8))
            }
          },
          onclose: (_url, reason) => {
            // Only log unexpected closes
            if (!['closed by caller', 'relay connection closed by us'].includes(reason)) {
              console.log('[BackgroundSub] Subscription closed for', channel.name, ':', reason)
            }
          }
        }
      )

      currentSubs.set(channel.id, sub)
    }

    // Cleanup function
    return () => {
      // Don't close subscriptions here - let the next effect run handle it
      // This prevents closing/reopening on every render
    }
  }, [channels, activeChannelId, favoriteRelays])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      console.log('[BackgroundSub] Cleaning up all subscriptions on unmount')
      for (const sub of subscriptionsRef.current.values()) {
        sub.close()
      }
      subscriptionsRef.current.clear()
    }
  }, [])
}
