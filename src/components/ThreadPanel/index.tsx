// ThreadPanel - Thread view panel (right side)
// Updated: 2025-11-16 - Integrated thread fetching

import { useThread } from '@/providers/ChannelProvider'
import { cn } from '@/lib/utils'
import { X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import client from '@/services/client.service'
import { Event as NEvent } from 'nostr-tools'
import MainNoteCard from '@/components/NoteCard/MainNoteCard'
import ReplyNoteList from '@/components/ReplyNoteList'

export interface ThreadPanelProps {
  /** Optional custom class name */
  className?: string
}

export default function ThreadPanel({ className }: ThreadPanelProps) {
  const { threadState, closeThread } = useThread()
  const [rootNote, setRootNote] = useState<NEvent | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch root note when thread opens
  useEffect(() => {
    if (!threadState?.isOpen || !threadState.noteId) {
      setRootNote(null)
      return
    }

    const fetchNote = async () => {
      if (!threadState.noteId) return

      setLoading(true)
      try {
        // Fetch from known relays
        const event = await client.fetchEvent(threadState.noteId)

        if (event) {
          setRootNote(event)
        }
      } catch (error) {
        console.error('Failed to fetch thread root note:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [threadState?.isOpen, threadState?.noteId])

  if (!threadState || !threadState.isOpen) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-l border-border',
        className
      )}
    >
      {/* Thread Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Thread</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeThread}
          aria-label="Close thread"
        >
          <X className="size-5" />
        </Button>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading thread...</p>
          </div>
        ) : rootNote ? (
          <div className="flex flex-col">
            {/* Root Note */}
            <div className="border-b border-border">
              <MainNoteCard event={rootNote} />
            </div>

            {/* Replies */}
            <div className="p-4">
              <ReplyNoteList event={rootNote} />
            </div>
          </div>
        ) : threadState.noteId ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <MessageSquare className="size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              Failed to load thread
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Note ID: {threadState.noteId.slice(0, 16)}...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No thread selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
