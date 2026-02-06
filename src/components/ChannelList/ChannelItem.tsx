// ChannelItem - Individual channel in the list

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TChannel } from '@/types/channel'
import { ArrowUpToLine, EllipsisVertical, Hash, Settings, Trash2 } from 'lucide-react'

export interface ChannelItemProps {
  channel: TChannel
  active: boolean
  collapse: boolean
  onClick: () => void
  onSettings: () => void
  onDelete: () => void
  onKeep?: () => void
  className?: string
}

export default function ChannelItem({
  channel,
  active,
  collapse,
  onClick,
  onSettings,
  onDelete,
  onKeep,
  className
}: ChannelItemProps) {
  const hasUnread = !active && (channel.unreadCount ?? 0) > 0

  return (
    <div
      className={cn(
        'group flex items-center rounded-lg w-full',
        'transition-colors duration-150',
        'hover:bg-accent/10',
        active && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
        collapse ? 'justify-center' : '',
        className
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-2 flex-1 min-w-0',
          collapse ? 'justify-center' : ''
        )}
        aria-label={`${channel.name} channel`}
        aria-current={active ? 'page' : undefined}
      >
        {/* Channel icon */}
        <div
          className={cn(
            'flex items-center justify-center shrink-0 relative',
            collapse ? 'size-6' : 'size-5'
          )}
        >
          {channel.icon ? (
            <span className="text-lg">{channel.icon}</span>
          ) : (
            <Hash className={cn(collapse ? 'size-5' : 'size-4')} />
          )}

          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
          )}
        </div>

        {/* Channel name and metadata */}
        {!collapse && (
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{channel.name}</span>
              {hasUnread && (
                <Badge
                  variant="default"
                  className="h-5 min-w-[20px] px-1.5 text-xs font-semibold"
                >
                  {channel.unreadCount! > 99 ? '99+' : channel.unreadCount}
                </Badge>
              )}
            </div>

            {channel.hashtags.length > 0 && (
              <div className="text-xs text-muted-foreground truncate">
                {channel.hashtags.slice(0, 2).map((tag) => `#${tag}`).join(', ')}
                {channel.hashtags.length > 2 && ` +${channel.hashtags.length - 2}`}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Three-dot menu - only in expanded mode */}
      {!collapse && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'p-1.5 mr-1 rounded-md shrink-0',
                'text-muted-foreground hover:text-foreground',
                'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
                'hover:bg-accent/10'
              )}
              aria-label={`${channel.name} options`}
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            {channel.autoDiscovered && onKeep && (
              <DropdownMenuItem onClick={onKeep}>
                <ArrowUpToLine className="size-4" />
                Keep Channel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete Channel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
