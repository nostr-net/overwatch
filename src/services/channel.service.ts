// Channel Service - Business logic layer for channel operations
// Created by: Programming Expert Agent
// Date: 2025-01-21
// Purpose: Provide dedicated service layer for channel-specific Nostr operations

import { Filter, Event as NEvent } from 'nostr-tools'
import { TSubRequestFilter } from '@/types'
import { TChannel } from '@/types/channel'
import client from './client.service'

export interface ChannelNoteFilters {
  limit?: number
  since?: number
  until?: number
}

export interface ChannelSubscriptionCallbacks {
  onEvents: (events: NEvent[], eosed: boolean) => void
  onNew: (event: NEvent) => void
  onClose?: (url: string, reason: string) => void
}

/**
 * Channel Service
 * Provides business logic for channel operations including hashtag filtering,
 * Nostr query building, and real-time subscriptions.
 */
class ChannelService {
  /**
   * Build Nostr filter for channel hashtags
   * @param channel - Channel configuration
   * @param filters - Additional filtering options
   * @returns Nostr filter object
   */
  buildChannelFilter(channel: TChannel, filters: ChannelNoteFilters = {}): Filter {
    const hashtagFilter: Filter = {
      '#t': channel.hashtags,
      kinds: [1, 42, 6, 7], // Text notes, channel messages, reposts, reactions
      ...filters
    }

    // Remove undefined filter properties
    Object.keys(hashtagFilter).forEach(key => {
      if (hashtagFilter[key as keyof Filter] === undefined) {
        delete hashtagFilter[key as keyof Filter]
      }
    })

    return hashtagFilter
  }

  /**
   * Get effective relay URLs for a channel
   * Uses channel-specific relays if available, otherwise falls back to default relays
   * @param channel - Channel configuration
   * @param defaultRelays - Fallback relay URLs
   * @returns Array of relay URLs to use
   */
  getEffectiveRelays(channel: TChannel, defaultRelays: string[] = []): string[] {
    return channel.relayUrls.length > 0 ? channel.relayUrls : defaultRelays
  }

  /**
   * Fetch historical notes for a channel
   * @param channel - Channel configuration
   * @param defaultRelays - Fallback relay URLs
   * @param filters - Additional filtering options
   * @returns Promise resolving to array of Nostr events
   */
  async fetchChannelNotes(
    channel: TChannel,
    defaultRelays: string[] = [],
    filters: ChannelNoteFilters = {}
  ): Promise<NEvent[]> {
    const relayUrls = this.getEffectiveRelays(channel, defaultRelays)

    if (relayUrls.length === 0) {
      console.warn('No relays available for channel:', channel.name)
      return []
    }

    const nostrFilter = this.buildChannelFilter(channel, filters)

    try {
      const events = await client.fetchEvents(relayUrls, nostrFilter)
      return events
    } catch (error) {
      console.error('Failed to fetch channel notes:', error)
      return []
    }
  }

  /**
   * Subscribe to real-time updates for a channel
   * @param channel - Channel configuration
   * @param defaultRelays - Fallback relay URLs
   * @param callbacks - Event handlers for subscription lifecycle
   * @param filters - Additional filtering options
   * @returns Subscription object with closer function
   */
  async subscribeToChannel(
    channel: TChannel,
    defaultRelays: string[],
    callbacks: ChannelSubscriptionCallbacks,
    filters: ChannelNoteFilters = {}
  ): Promise<{ closer: () => void; timelineKey: string }> {
    const relayUrls = this.getEffectiveRelays(channel, defaultRelays)

    if (relayUrls.length === 0) {
      console.warn('No relays available for channel subscription:', channel.name)
      return {
        closer: () => {},
        timelineKey: `channel-${channel.id}-empty`
      }
    }

    const nostrFilter = this.buildChannelFilter(channel, {
      ...filters,
      limit: filters.limit || 200
    })

    const subRequests = [
      {
        urls: relayUrls,
        filter: nostrFilter as TSubRequestFilter
      }
    ]

    try {
      const subscription = await client.subscribeTimeline(subRequests, callbacks, {
        needSort: true
      })

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to channel:', error)
      return {
        closer: () => {},
        timelineKey: `channel-${channel.id}-error`
      }
    }
  }

  /**
   * Extract hashtags from note content
   * @param content - Note text content
   * @returns Array of hashtag strings (without # prefix)
   */
  extractHashtagsFromContent(content: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g
    const hashtags = new Set<string>()
    let match

    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.add(match[1].toLowerCase())
    }

    return Array.from(hashtags)
  }

  /**
   * Check if a note belongs to a channel based on hashtags
   * @param event - Nostr event
   * @param channel - Channel configuration
   * @returns True if event matches channel hashtags
   */
  isEventInChannel(event: NEvent, channel: TChannel): boolean {
    const eventTags = event.tags?.filter(tag => tag[0] === 't').map(tag => tag[1]) || []

    // Check if any of the channel's hashtags are present in the event
    return channel.hashtags.some((channelHashtag: string) =>
      eventTags.some((eventHashtag: string) =>
        eventHashtag.toLowerCase() === channelHashtag.toLowerCase()
      )
    )
  }

  /**
   * Update channel activity timestamp
   * This should be called when new events arrive for a channel
   * @param channelId - Channel ID
   */
  updateChannelActivity(channelId: string): void {
    // This would typically update a lastActivity timestamp in the channel
    // For now, we'll use localStorage to persist this information
    try {
      const activityKey = `channel-activity-${channelId}`
      localStorage.setItem(activityKey, Date.now().toString())
    } catch (error) {
      console.error('Failed to update channel activity:', error)
    }
  }

  /**
   * Get channel activity timestamp
   * @param channelId - Channel ID
   * @returns Last activity timestamp or 0 if not available
   */
  getChannelActivity(channelId: string): number {
    try {
      const activityKey = `channel-activity-${channelId}`
      const timestamp = localStorage.getItem(activityKey)
      return timestamp ? parseInt(timestamp, 10) : 0
    } catch (error) {
      console.error('Failed to get channel activity:', error)
      return 0
    }
  }

  /**
   * Calculate unread count for a channel
   * @param channelId - Channel ID
   * @param lastReadAt - Last read timestamp (in milliseconds from Date.now())
   * @returns Number of unread events
   */
  getUnreadCount(channelId: string, lastReadAt: number): number {
    const activityKey = `channel-events-${channelId}`
    try {
      const eventTimestamps: number[] = JSON.parse(localStorage.getItem(activityKey) || '[]')
      // Convert lastReadAt from milliseconds to seconds for comparison with Nostr event timestamps
      const lastReadAtSeconds = Math.floor(lastReadAt / 1000)
      const unreadCount = eventTimestamps.filter((timestamp: number) => timestamp > lastReadAtSeconds).length

      if (eventTimestamps.length > 0) {
        console.log('[ChannelService] getUnreadCount:', {
          channelId: channelId.slice(0, 8),
          lastReadAt,
          lastReadAtSeconds,
          totalEvents: eventTimestamps.length,
          latestEventTimestamp: Math.max(...eventTimestamps),
          unreadCount
        })
      }

      return unreadCount
    } catch (error) {
      console.error('Failed to calculate unread count:', error)
      return 0
    }
  }

  /**
   * Track events for unread calculation
   * @param channelId - Channel ID
   * @param eventTimestamp - Event timestamp to track
   */
  trackEventForUnread(channelId: string, eventTimestamp: number): void {
    const activityKey = `channel-events-${channelId}`
    try {
      const eventTimestamps: number[] = JSON.parse(localStorage.getItem(activityKey) || '[]')

      // Avoid tracking duplicate timestamps
      if (eventTimestamps.includes(eventTimestamp)) {
        return
      }

      eventTimestamps.push(eventTimestamp)
      console.log('[ChannelService] trackEventForUnread:', {
        channelId: channelId.slice(0, 8),
        eventTimestamp,
        totalTracked: eventTimestamps.length
      })

      // Keep only last 1000 events to prevent storage bloat
      if (eventTimestamps.length > 1000) {
        eventTimestamps.splice(0, eventTimestamps.length - 1000)
      }

      localStorage.setItem(activityKey, JSON.stringify(eventTimestamps))

      // Dispatch custom event to trigger immediate unread count update
      window.dispatchEvent(new CustomEvent('channel-unread-updated', { detail: { channelId } }))
    } catch (error) {
      console.error('Failed to track event for unread:', error)
    }
  }
}

// Export singleton instance
export default new ChannelService()