// ChannelList - List of channels in sidebar

import { cn } from '@/lib/utils'
import { useChannel } from '@/providers/ChannelProvider'
import { LOCKED_RELAY } from '@/constants'
import { TChannel } from '@/types/channel'
import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ChannelItem from './ChannelItem'
import CreateChannelDialog from './CreateChannelDialog'
import ChannelSettings from '@/components/ChannelSettings'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

export interface ChannelListProps {
  collapse: boolean
  className?: string
}

export default function ChannelList({ collapse, className }: ChannelListProps) {
  const { channels, activeChannel, setActiveChannel, deleteChannel, keepChannel } = useChannel()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [settingsChannel, setSettingsChannel] = useState<TChannel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TChannel | null>(null)

  const { manualChannels, autoChannels } = useMemo(() => {
    const manual = channels.filter((c) => !c.autoDiscovered).sort((a, b) => a.order - b.order)
    const auto = channels
      .filter((c) => c.autoDiscovered)
      .sort((a, b) => (b.eventCount ?? 0) - (a.eventCount ?? 0))
    return { manualChannels: manual, autoChannels: auto }
  }, [channels])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteChannel(deleteTarget.id)
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
    setDeleteTarget(null)
  }, [deleteTarget, deleteChannel])

  const renderItem = (channel: TChannel) => (
    <ChannelItem
      key={channel.id}
      channel={channel}
      active={activeChannel?.id === channel.id}
      collapse={collapse}
      onClick={() => setActiveChannel(channel.id)}
      onSettings={() => setSettingsChannel(channel)}
      onDelete={() => setDeleteTarget(channel)}
      onKeep={channel.autoDiscovered ? () => keepChannel(channel.id) : undefined}
    />
  )

  return (
    <>
      <div className={cn('flex flex-col gap-1 flex-1 overflow-y-auto', className)}>
        {/* Manual channels */}
        <div className="space-y-1">
          {manualChannels.map(renderItem)}
        </div>

        {/* Create channel button */}
        <button
          onClick={() => setCreateDialogOpen(true)}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            'hover:bg-accent/10 transition-colors',
            'text-muted-foreground hover:text-foreground',
            'mt-2',
            collapse ? 'justify-center' : ''
          )}
          aria-label="Create new channel"
        >
          <Plus className={cn(collapse ? 'size-5' : 'size-4')} />
          {!collapse && <span className="text-sm font-medium">Create Channel</span>}
        </button>

        {/* Auto-discovered channels */}
        {autoChannels.length > 0 && (
          <>
            {!collapse && (
              <div className="px-2 pt-4 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Discovered
                </span>
              </div>
            )}
            <div className="space-y-1">
              {autoChannels.map(renderItem)}
            </div>
          </>
        )}

        {/* Empty state */}
        {channels.length === 0 && !collapse && (
          <div className="text-center py-8 text-muted-foreground">
            {LOCKED_RELAY ? (
              <>
                <p className="text-sm">Scanning relay for hashtags...</p>
                <p className="text-xs mt-1">Channels will appear as hashtags are discovered</p>
              </>
            ) : (
              <>
                <p className="text-sm">No channels yet</p>
                <p className="text-xs mt-1">Create your first channel to get started</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create channel dialog */}
      <CreateChannelDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Channel settings dialog */}
      {settingsChannel && (
        <ChannelSettings
          channel={settingsChannel}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSettingsChannel(null)
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
