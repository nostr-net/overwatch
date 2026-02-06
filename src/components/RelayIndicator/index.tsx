// RelayIndicator - Shows connected relay(s) in sidebar above login button
// Created: 2025-11-16

import { useFavoriteRelays } from '@/providers/FavoriteRelaysProvider'
import { Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import RelaySelectionDialog from '@/components/RelaySelectionDialog'

export default function RelayIndicator({ collapse }: { collapse: boolean }) {
  const { favoriteRelays, addFavoriteRelays, deleteFavoriteRelays } = useFavoriteRelays()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Extract relay name from URL (remove wss://, trailing slash, and show domain)
  const getRelayName = (url: string) => {
    try {
      const cleanUrl = url.replace(/^wss?:\/\//, '').replace(/\/$/, '')
      // Get just the domain name (first part before any path)
      const domain = cleanUrl.split('/')[0]
      return domain
    } catch {
      return url
    }
  }

  const handleRelaySelection = async (relays: string[]) => {
    // Calculate what to add and what to remove
    const currentSet = new Set(favoriteRelays)
    const newSet = new Set(relays)

    const toAdd = relays.filter((r) => !currentSet.has(r))
    const toRemove = favoriteRelays.filter((r) => !newSet.has(r))

    // Update favorite relays
    if (toRemove.length > 0) {
      await deleteFavoriteRelays(toRemove)
    }
    if (toAdd.length > 0) {
      await addFavoriteRelays(toAdd)
    }

    setDialogOpen(false)
  }

  if (favoriteRelays.length === 0) {
    return (
      <>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            'bg-background/95',
            'border border-border rounded-lg',
            'text-xs font-medium text-muted-foreground',
            'hover:bg-accent/50 transition-colors cursor-pointer',
            collapse && 'justify-center px-2'
          )}
          onClick={() => setDialogOpen(true)}
        >
          <WifiOff className="size-4 shrink-0" />
          {!collapse && <span className="truncate">No relays</span>}
        </div>
        <RelaySelectionDialog
          open={dialogOpen}
          onComplete={handleRelaySelection}
          onClose={() => setDialogOpen(false)}
          initialRelays={favoriteRelays}
        />
      </>
    )
  }

  const displayText =
    favoriteRelays.length === 1
      ? getRelayName(favoriteRelays[0])
      : `${favoriteRelays.length} relays`

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2',
          'bg-background/95',
          'border border-border rounded-lg',
          'text-xs font-medium',
          'hover:bg-accent/50 transition-colors cursor-pointer',
          collapse && 'justify-center px-2'
        )}
        title={favoriteRelays.map((r) => getRelayName(r)).join('\n')}
        onClick={() => setDialogOpen(true)}
      >
        <Wifi className="size-4 text-primary shrink-0" />
        {!collapse && <span className="text-foreground truncate">{displayText}</span>}
      </div>
      <RelaySelectionDialog
        open={dialogOpen}
        onComplete={handleRelaySelection}
        onClose={() => setDialogOpen(false)}
        initialRelays={favoriteRelays}
      />
    </>
  )
}
