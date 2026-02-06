// Channel Provider - State management for channels
// Created by: Programming Expert Agent
// Date: 2025-11-16
// Updated: 2025-11-16 - Added default channels

import type { TChannel, TChannelCreateInput, TChannelUpdateInput } from '@/types/channel'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { createContext, ReactNode, useCallback, useContext, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import channelService from '@/services/channel.service'
import { useChannelBackgroundSubscriptions } from '@/hooks/useChannelBackgroundSubscriptions'
import { useHashtagDiscovery } from '@/hooks/useHashtagDiscovery'

// Polyfill for crypto.randomUUID with fallback
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Atoms for channel state
export const channelsAtom = atomWithStorage<TChannel[]>('channels', [])
export const activeChannelIdAtom = atom<string | null>(null)
export const dismissedHashtagsAtom = atomWithStorage<Record<string, number>>('dismissed-hashtags', {})

// Thread state atom
export const threadStateAtom = atom<{
  isOpen: boolean
  noteId: string | null
} | null>(null)

// Context type
type TChannelContext = {
  // Channel list
  channels: TChannel[]
  activeChannel: TChannel | null

  // Actions
  setActiveChannel: (channelId: string) => void
  createChannel: (data: TChannelCreateInput) => Promise<TChannel>
  updateChannel: (id: string, updates: TChannelUpdateInput) => Promise<void>
  deleteChannel: (id: string) => Promise<void>
  keepChannel: (id: string) => void

  // Utilities
  getChannelById: (id: string) => TChannel | undefined
  reorderChannels: (channelIds: string[]) => void
}

const ChannelContext = createContext<TChannelContext | undefined>(undefined)

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useAtom(channelsAtom)
  const [activeChannelId, setActiveChannelId] = useAtom(activeChannelIdAtom)

  // Set first channel as active if channels exist but no active channel is set
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id)
    }
  }, [])

  // Get active channel
  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || null,
    [channels, activeChannelId]
  )

  // Background subscriptions for all channels to track unread counts
  useChannelBackgroundSubscriptions(channels, activeChannelId)

  // Auto-discover channels from relay hashtags (only when LOCKED_RELAY is set)
  useHashtagDiscovery()

  // Update unread counts for all channels
  const updateUnreadCounts = useCallback(() => {
    setChannels(prevChannels => {
      const updatedChannels = prevChannels.map(channel => {
        const lastReadAt = channel.lastReadAt ?? channel.created_at
        const unreadCount = channelService.getUnreadCount(channel.id, lastReadAt)
        return {
          ...channel,
          unreadCount
        }
      })

      // Only update if counts changed
      const hasChanges = updatedChannels.some((channel, index) =>
        channel.unreadCount !== prevChannels[index].unreadCount
      )

      return hasChanges ? updatedChannels : prevChannels
    })
  }, [setChannels])

  // Update unread counts periodically
  useEffect(() => {
    // Initial update
    updateUnreadCounts()

    // Update every 10 seconds for better responsiveness
    const interval = setInterval(updateUnreadCounts, 10000)

    // Listen for custom event when new events are tracked
    const handleUnreadUpdate = () => {
      updateUnreadCounts()
    }
    window.addEventListener('channel-unread-updated', handleUnreadUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('channel-unread-updated', handleUnreadUpdate)
    }
  }, [updateUnreadCounts])

  // Set active channel and close any open thread
  const setActiveChannel = useCallback(
    (channelId: string) => {
      const channel = channels.find((c) => c.id === channelId)
      if (!channel) {
        console.warn(`Channel ${channelId} not found`)
        return
      }

      setActiveChannelId(channelId)

      // Update last read timestamp and clear unread count
      const channelIndex = channels.findIndex((c) => c.id === channelId)
      if (channelIndex !== -1) {
        const updatedChannels = [...channels]
        updatedChannels[channelIndex] = {
          ...channels[channelIndex],
          lastReadAt: Date.now(),
          unreadCount: 0
        }
        setChannels(updatedChannels)
      }
    },
    [channels, setChannels]
  )

  // Create new channel
  const createChannel = useCallback(
    async (data: TChannelCreateInput): Promise<TChannel> => {
      try {
        // Validate hashtags
        if (!data.hashtags || data.hashtags.length === 0) {
          throw new Error('At least one hashtag is required')
        }

        // Validate relay URLs
        if (!data.relayUrls || data.relayUrls.length === 0) {
          throw new Error('At least one relay is required')
        }

        const newChannel: TChannel = {
          ...data,
          id: generateUUID(),
          created_at: Date.now(),
          updated_at: Date.now(),
          order: channels.length,
          hashtags: data.hashtags.map((tag) => tag.toLowerCase().replace(/^#/, '')),
          lastReadAt: Date.now()
        }

        const updatedChannels = [...channels, newChannel]
        setChannels(updatedChannels)

        toast.success(`Channel "${newChannel.name}" created`)

        return newChannel
      } catch (error) {
        console.error('Failed to create channel:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create channel')
        throw error
      }
    },
    [channels, setChannels]
  )

  // Update channel
  const updateChannel = useCallback(
    async (id: string, updates: TChannelUpdateInput): Promise<void> => {
      try {
        const channelIndex = channels.findIndex((c) => c.id === id)
        if (channelIndex === -1) {
          throw new Error('Channel not found')
        }

        const updatedChannel: TChannel = {
          ...channels[channelIndex],
          ...updates,
          updated_at: Date.now(),
          // Ensure hashtags are normalized if provided
          ...(updates.hashtags && {
            hashtags: updates.hashtags.map((tag) => tag.toLowerCase().replace(/^#/, ''))
          })
        }

        const updatedChannels = [...channels]
        updatedChannels[channelIndex] = updatedChannel
        setChannels(updatedChannels)

        // Don't toast for silent updates (like lastReadAt)
        if (!('lastReadAt' in updates && Object.keys(updates).length === 1)) {
          toast.success('Channel updated')
        }
      } catch (error) {
        console.error('Failed to update channel:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update channel')
        throw error
      }
    },
    [channels, setChannels]
  )

  // Delete channel
  const [, setDismissedHashtags] = useAtom(dismissedHashtagsAtom)

  const deleteChannel = useCallback(
    async (id: string): Promise<void> => {
      try {
        const channel = channels.find((c) => c.id === id)
        if (!channel) {
          throw new Error('Channel not found')
        }

        // Track dismissed hashtags with timestamp for auto-discovered channels
        if (channel.autoDiscovered && channel.hashtags.length > 0) {
          setDismissedHashtags((prev) => {
            const now = Math.floor(Date.now() / 1000)
            const updated = { ...prev }
            for (const h of channel.hashtags) {
              updated[h] = now
            }
            return updated
          })
        }

        const updatedChannels = channels.filter((c) => c.id !== id)
        setChannels(updatedChannels)

        // Clear active channel if deleted
        if (activeChannelId === id) {
          setActiveChannelId(null)
        }

        toast.success(`Channel "${channel.name}" deleted`)
      } catch (error) {
        console.error('Failed to delete channel:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete channel')
        throw error
      }
    },
    [channels, setChannels, activeChannelId, setActiveChannelId, setDismissedHashtags]
  )

  // Move auto-discovered channel to regular channel list
  const keepChannel = useCallback(
    (id: string) => {
      const channelIndex = channels.findIndex((c) => c.id === id)
      if (channelIndex === -1) return

      const channel = channels[channelIndex]
      if (!channel.autoDiscovered) return

      // Assign order after existing manual channels
      const manualCount = channels.filter((c) => !c.autoDiscovered).length

      const updatedChannels = [...channels]
      updatedChannels[channelIndex] = {
        ...channel,
        autoDiscovered: false,
        eventCount: undefined,
        order: manualCount,
        updated_at: Date.now()
      }
      setChannels(updatedChannels)
      toast.success(`Channel "${channel.name}" moved to your channels`)
    },
    [channels, setChannels]
  )

  // Get channel by ID
  const getChannelById = useCallback(
    (id: string): TChannel | undefined => {
      return channels.find((c) => c.id === id)
    },
    [channels]
  )

  // Reorder channels
  const reorderChannels = useCallback(
    (channelIds: string[]) => {
      const reordered = channelIds
        .map((id, index) => {
          const channel = channels.find((c) => c.id === id)
          return channel ? { ...channel, order: index } : null
        })
        .filter(Boolean) as TChannel[]

      setChannels(reordered)
      toast.success('Channels reordered')
    },
    [channels, setChannels]
  )

  const value: TChannelContext = {
    channels,
    activeChannel,
    setActiveChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    keepChannel,
    getChannelById,
    reorderChannels
  }

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
}

export function useChannel() {
  const context = useContext(ChannelContext)
  if (!context) {
    throw new Error('useChannel must be used within a ChannelProvider')
  }
  return context
}

// Thread management hooks
export function useThread() {
  const [threadState, setThreadState] = useAtom(threadStateAtom)

  const openThread = useCallback(
    (noteId: string) => {
      setThreadState({ isOpen: true, noteId })
    },
    [setThreadState]
  )

  const closeThread = useCallback(() => {
    setThreadState(null)
  }, [setThreadState])

  return {
    threadState,
    openThread,
    closeThread
  }
}
