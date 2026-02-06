// useChannelFeed Hook
// Created by: Programming Expert Agent
// Date: 2025-01-21
// Purpose: Custom hook for managing channel feed subscriptions and data

import { useCallback, useEffect, useRef, useState } from 'react'
import { Event as NEvent } from 'nostr-tools'
import { TChannel } from '@/types/channel'
import { useFavoriteRelays } from '@/providers/FavoriteRelaysProvider'
import { useKindFilter } from '@/providers/KindFilterProvider'
import channelService from '@/services/channel.service'

export interface ChannelFeedState {
  events: NEvent[]
  newEvents: NEvent[]
  loading: boolean
  error: string | null
  hasMore: boolean
}

export interface ChannelFeedActions {
  refresh: () => void
  loadMore: () => Promise<void>
  clearNewEvents: () => void
}

/**
 * Custom hook for managing channel feed data and subscriptions
 * @param channel - Channel configuration (can be null)
 * @returns Object containing feed state and actions
 */
export function useChannelFeed(channel: TChannel | null) {
  const { favoriteRelays } = useFavoriteRelays()
  const { showKinds } = useKindFilter()

  const [state, setState] = useState<ChannelFeedState>({
    events: [],
    newEvents: [],
    loading: true,
    error: null,
    hasMore: true
  })

  const subscriptionRef = useRef<{ closer: () => void; timelineKey?: string } | null>(null)
  const mountedRef = useRef(true)

  // Clean up subscription on unmount
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      if (subscriptionRef.current?.closer) {
        subscriptionRef.current.closer()
        subscriptionRef.current = null
      }
    }
  }, [])

  // Subscribe to channel when channel changes
  useEffect(() => {
    if (!channel || channel.hashtags.length === 0) {
      setState(prev => ({
        ...prev,
        events: [],
        newEvents: [],
        loading: false,
        error: null
      }))
      return
    }

    // Close existing subscription
    if (subscriptionRef.current?.closer) {
      subscriptionRef.current.closer()
      subscriptionRef.current = null
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      events: [],
      newEvents: []
    }))

    // Set up new subscription
    const setupSubscription = async () => {
      try {
        const subscription = await channelService.subscribeToChannel(
          channel,
          favoriteRelays,
          {
            onEvents: (events, eosed) => {
              if (!mountedRef.current) return

              setState(prev => {
                // Filter by showKinds
                const filteredEvents = events.filter(event =>
                  showKinds.includes(event.kind)
                )

                return {
                  ...prev,
                  events: filteredEvents,
                  loading: !eosed,
                  hasMore: filteredEvents.length >= 200
                }
              })

              // Update channel activity
              if (events.length > 0) {
                channelService.updateChannelActivity(channel.id)
                events.forEach(event => {
                  channelService.trackEventForUnread(channel.id, event.created_at)
                })
              }
            },
            onNew: (event) => {
              if (!mountedRef.current) return

              // Filter by showKinds
              if (!showKinds.includes(event.kind)) return

              setState(prev => ({
                ...prev,
                newEvents: [...prev.newEvents, event]
              }))

              // Update channel activity
              channelService.updateChannelActivity(channel.id)
              channelService.trackEventForUnread(channel.id, event.created_at)
            },
            onClose: () => {
              // Optional: Handle subscription closure for debugging
            }
          },
          { limit: 200 }
        )

        if (mountedRef.current) {
          subscriptionRef.current = subscription
        }
      } catch (error) {
        console.error('Failed to set up channel subscription:', error)
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load channel'
          }))
        }
      }
    }

    setupSubscription()
  }, [channel, favoriteRelays, showKinds])

  // Refresh feed
  const refresh = useCallback(() => {
    if (!subscriptionRef.current) return

    setState(prev => ({
      ...prev,
      events: [],
      newEvents: [],
      loading: true,
      error: null
    }))

    // Close and reopen subscription
    if (subscriptionRef.current?.closer) {
      subscriptionRef.current.closer()
      subscriptionRef.current = null
    }

    // The useEffect will handle resubscribing
  }, [])

  // Load more events
  const loadMore = useCallback(async () => {
    if (!channel || state.loading || !state.hasMore || !subscriptionRef.current?.timelineKey) {
      return
    }

    const oldestEvent = state.events[state.events.length - 1]
    if (!oldestEvent) return

    setState(prev => ({ ...prev, loading: true }))

    try {
      const moreEvents = await channelService.fetchChannelNotes(
        channel,
        favoriteRelays,
        {
          until: oldestEvent.created_at - 1,
          limit: 100
        }
      )

      if (!mountedRef.current) return

      const filteredMoreEvents = moreEvents.filter(event =>
        showKinds.includes(event.kind)
      )

      setState(prev => ({
        ...prev,
        events: [...prev.events, ...filteredMoreEvents],
        loading: false,
        hasMore: filteredMoreEvents.length >= 100
      }))
    } catch (error) {
      console.error('Failed to load more events:', error)
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load more events'
        }))
      }
    }
  }, [channel, favoriteRelays, showKinds, state.events, state.loading, state.hasMore])

  // Clear new events
  const clearNewEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      newEvents: []
    }))
  }, [])

  const actions: ChannelFeedActions = {
    refresh,
    loadMore,
    clearNewEvents
  }

  return { state, actions }
}