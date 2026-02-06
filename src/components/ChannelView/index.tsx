// ChannelView - Main channel content display
// Updated: 2025-01-21 - Fixed hashtag filtering and improved thread handling

import { useChannel, useThread } from '@/providers/ChannelProvider'
import { ChevronLeft, Hash, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import NoteList from '@/components/NoteList'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import ChannelSettings from '@/components/ChannelSettings'
import { useKindFilter } from '@/providers/KindFilterProvider'
import { useSecondaryPage } from '@/PageManager'
import { useFavoriteRelays } from '@/providers/FavoriteRelaysProvider'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { TFeedSubRequest } from '@/types'
import ChannelList from '@/components/ChannelList'

export interface ChannelViewProps {
  /** Optional custom class name */
  className?: string
}

export default function ChannelView({ className }: ChannelViewProps) {
  const { activeChannel, clearActiveChannel } = useChannel()
  const { showKinds } = useKindFilter()
  const { openThread } = useThread()
  const { currentIndex } = useSecondaryPage()
  const { favoriteRelays } = useFavoriteRelays()
  const { isSmallScreen } = useScreenSize()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [previousIndex, setPreviousIndex] = useState(currentIndex)

  // Intercept secondary page navigation to open threads instead
  useEffect(() => {
    if (currentIndex !== previousIndex && currentIndex > 0) {
      // Secondary page was opened - extract note ID from URL and open thread
      const path = window.location.pathname
      const noteMatch = path.match(/\/notes?\/(note1\w+|nevent1\w+)/)

      if (noteMatch) {
        const noteId = noteMatch[1]
        // Open thread instead of navigating
        openThread(noteId)
        // Go back to clear the secondary page
        window.history.back()
      }
    }
    setPreviousIndex(currentIndex)
  }, [currentIndex, previousIndex, openThread])


  if (!activeChannel) {
    if (isSmallScreen) {
      return (
        <div className={cn('flex flex-col h-full', className)}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <h1 className="text-lg font-semibold">Channels</h1>
          </div>
          <ChannelList collapse={false} className="p-2" />
        </div>
      )
    }
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <Hash className="size-16 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">No channel selected</p>
        <p className="text-sm text-muted-foreground mt-2">
          Select a channel from the sidebar or create a new one
        </p>
      </div>
    )
  }

  // Build Nostr filter for channel hashtags
  // Use channel-specific relays if available, otherwise fall back to favorite relays
  const relayUrls = activeChannel.relayUrls.length > 0 ? activeChannel.relayUrls : favoriteRelays

  // Build subscription requests with proper error handling
  const subRequests: TFeedSubRequest[] = []

  if (relayUrls.length > 0 && activeChannel.hashtags.length > 0) {
    subRequests.push({
      urls: relayUrls,
      filter: {
        '#t': activeChannel.hashtags,
        kinds: [1, 42, 6, 7] // Text notes, channel messages, reposts, reactions
      }
    })
  } else {
    // Cannot build subscription requests - missing relays or hashtags
    // This is handled gracefully by the empty subRequests array
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Channel Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        {isSmallScreen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearActiveChannel}
            aria-label="Back to channels"
            className="-ml-2"
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <div className="flex items-center justify-center size-8">
          {activeChannel.icon ? (
            <span className="text-2xl">{activeChannel.icon}</span>
          ) : (
            <Hash className="size-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{activeChannel.name}</h1>
          {activeChannel.description && (
            <p className="text-sm text-muted-foreground truncate">{activeChannel.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeChannel.hashtags.map((tag) => `#${tag}`).join(' ')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="Channel settings"
        >
          <Settings className="size-5" />
        </Button>
      </div>

      {/* Channel Content - Uses existing NoteList component */}
      <div className="flex-1 overflow-auto">
        {activeChannel.hashtags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <Hash className="size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No hashtags configured for this channel
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Click the settings button to add hashtags
            </p>
          </div>
        ) : subRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <Hash className="size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No relays configured for this channel
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Click the settings button to add relays
            </p>
          </div>
        ) : (
          <NoteList
            channelId={activeChannel.id}
            subRequests={subRequests}
            showKinds={showKinds}
            hideReplies={false}
            hideUntrustedNotes={false}
            areAlgoRelays={false}
            showRelayCloseReason={true}
          />
        )}
      </div>

      {/* Channel Settings Dialog */}
      {settingsOpen && (
        <ChannelSettings
          channel={activeChannel}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </div>
  )
}
