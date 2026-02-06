// ProfileEditorSidebar - Compact profile display for sidebar
// Created by: Programming Expert Agent
// Date: 2025-11-16
// Based on design: docs/architecture/task-1.1.2-profileeditor-design.md

import { SimpleUserAvatar } from '@/components/UserAvatar'
import { SimpleUsername } from '@/components/Username'
import { cn } from '@/lib/utils'
import { useNostr } from '@/providers/NostrProvider'
import { LogIn, Settings } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'

// Lazy load the edit dialog for performance
const ProfileEditDialog = lazy(() => import('./ProfileEditDialog'))

export interface ProfileEditorSidebarProps {
  /** Collapse state from sidebar */
  collapse: boolean

  /** Optional custom class name */
  className?: string

  /** Optional callback when profile is edited */
  onProfileUpdate?: () => void
}

export default function ProfileEditorSidebar({
  collapse,
  className,
  onProfileUpdate
}: ProfileEditorSidebarProps) {
  const { pubkey } = useNostr()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Not logged in - show login prompt
  if (!pubkey) {
    return <LoginPrompt collapse={collapse} />
  }

  return (
    <>
      <ProfileDisplay
        pubkey={pubkey}
        collapse={collapse}
        onEditClick={() => setEditDialogOpen(true)}
        className={className}
      />

      <Suspense fallback={null}>
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={onProfileUpdate}
        />
      </Suspense>
    </>
  )
}

/**
 * ProfileDisplay - Main profile display component
 */
function ProfileDisplay({
  pubkey,
  collapse,
  onEditClick,
  className
}: {
  pubkey: string
  collapse: boolean
  onEditClick: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-lg',
        'hover:bg-accent/10 transition-colors cursor-pointer',
        'border-b border-border',
        collapse ? 'flex-col justify-center' : '',
        className
      )}
      onClick={onEditClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEditClick()}
      aria-label="View and edit profile"
    >
      {/* Edit Icon - Always visible */}
      <button
        className="absolute top-2 right-2 p-1 rounded hover:bg-accent/20 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          onEditClick()
        }}
        aria-label="Edit Profile"
      >
        <Settings className={cn(collapse ? 'size-3' : 'size-4')} />
      </button>

      {/* Avatar */}
      <SimpleUserAvatar userId={pubkey} size={collapse ? 'medium' : 'large'} />

      {/* Profile Info - Only in expanded mode */}
      {!collapse && (
        <div className="flex-1 min-w-0">
          <SimpleUsername
            userId={pubkey}
            className="font-semibold text-sm truncate block"
            skeletonClassName="h-4 w-24"
          />
          <div className="text-xs text-muted-foreground truncate">
            @{formatNpub(pubkey, 12)}
          </div>
        </div>
      )}

      {/* Screen reader helper */}
      <span className="sr-only">{collapse ? 'Your profile' : 'Click to edit profile'}</span>
    </div>
  )
}

/**
 * LoginPrompt - Shown when user is not logged in
 */
function LoginPrompt({ collapse }: { collapse: boolean }) {
  const { checkLogin } = useNostr()

  return (
    <button
      onClick={() => checkLogin()}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg w-full',
        'hover:bg-accent/10 transition-colors',
        'border-b border-border',
        collapse ? 'flex-col justify-center' : ''
      )}
      aria-label="Login to Nostr"
    >
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center',
          collapse ? 'w-10 h-10' : 'w-12 h-12'
        )}
      >
        <LogIn className="size-5 text-muted-foreground" />
      </div>

      {!collapse && (
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">Login</div>
          <div className="text-xs text-muted-foreground">Connect your Nostr identity</div>
        </div>
      )}
    </button>
  )
}

/**
 * Format npub for display
 */
function formatNpub(pubkey: string, length: number = 12): string {
  // Convert pubkey to npub format
  const npub = pubkey.startsWith('npub1') ? pubkey : `npub1${pubkey.slice(0, 60)}`
  return `${npub.slice(0, length)}...${npub.slice(-4)}`
}
