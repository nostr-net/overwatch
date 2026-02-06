// Channel Type Definitions for Slack-like Interface
// Created by: Software Architect Agent
// Date: 2025-11-16

/**
 * Channel - Represents a hashtag-based conversation channel
 * Channels filter Nostr notes by one or more hashtags
 */
export type TChannel = {
  /** Unique identifier (UUID) */
  id: string

  /** Display name of the channel */
  name: string

  /** Optional description */
  description?: string

  /** Hashtags to filter by (OR logic) */
  hashtags: string[]

  /** Relay URLs specific to this channel */
  relayUrls: string[]

  /** Optional emoji or icon */
  icon?: string

  /** Optional color theme for channel */
  color?: string

  /** Creation timestamp (Unix) */
  created_at: number

  /** Last modification timestamp (Unix) */
  updated_at: number

  /** Order/position in channel list */
  order: number

  /** Client-side calculated unread count */
  unreadCount?: number

  /** Last time user viewed this channel */
  lastReadAt?: number

  /** Whether channel is muted */
  muted?: boolean

  /** Whether this channel was auto-discovered from relay hashtags */
  autoDiscovered?: boolean

  /** Number of events using this hashtag (for sorting by popularity) */
  eventCount?: number
}

/**
 * Channel settings - User preferences per channel
 */
export type TChannelSettings = {
  /** Enable notifications for this channel */
  notificationsEnabled: boolean

  /** Show replies inline or in threads */
  showReplies: boolean

  /** Sort order for notes */
  sortBy: 'chronological' | 'engagement'

  /** Auto-mark as read on view */
  autoMarkRead: boolean
}

/**
 * Channel creation input (omits auto-generated fields)
 */
export type TChannelCreateInput = Omit<TChannel, 'id' | 'created_at' | 'updated_at' | 'order'>

/**
 * Channel update input (partial updates allowed)
 */
export type TChannelUpdateInput = Partial<Omit<TChannel, 'id' | 'created_at'>>

/**
 * Thread - Represents a conversation thread in a channel
 * Groups a root note with its replies
 */
export type TThread = {
  /** Root event ID (thread identifier) */
  rootId: string

  /** The root note (may be null if not fetched yet) */
  rootNote: NEvent | null

  /** All replies to the root note */
  replies: NEvent[]

  /** Total reply count */
  replyCount: number

  /** Timestamp of latest reply */
  latestTimestamp: number

  /** Participant pubkeys */
  participants: string[]

  /** Whether user has unread replies */
  hasUnread: boolean
}

/**
 * Channel with computed metadata
 */
export type TChannelWithMetadata = TChannel & {
  /** Number of notes in channel (approximate) */
  noteCount: number

  /** Last note timestamp */
  lastActivityAt: number

  /** Active participant count */
  participantCount: number
}

// Re-export Nostr Event type from nostr-tools
import type { Event as NEvent } from 'nostr-tools'
export type { NEvent }
