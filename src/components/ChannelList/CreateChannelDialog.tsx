// CreateChannelDialog - Dialog for creating new channels
// Created by: Programming Expert Agent
// Date: 2025-11-16

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BIG_RELAY_URLS } from '@/constants'
import { useChannel } from '@/providers/ChannelProvider'
import { useFavoriteRelays } from '@/providers/FavoriteRelaysProvider'
import { useState } from 'react'
import { toast } from 'sonner'

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const { createChannel } = useChannel()
  const { favoriteRelays: favoriteRelayUrls } = useFavoriteRelays()
  const [creating, setCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hashtags: '',
    icon: ''
  })

  // Use favorite relays or fallback to big relays
  const defaultRelays = favoriteRelayUrls.length > 0 ? favoriteRelayUrls : BIG_RELAY_URLS.slice(0, 3)

  const handleCreate = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a channel name')
      return
    }

    if (!formData.hashtags.trim()) {
      toast.error('Please enter at least one hashtag')
      return
    }

    setCreating(true)
    try {
      // Parse hashtags (comma or space separated)
      const hashtags = formData.hashtags
        .split(/[,\s]+/)
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter((tag) => tag.length > 0)

      if (hashtags.length === 0) {
        toast.error('Please enter valid hashtags')
        return
      }

      // Create channel
      await createChannel({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        hashtags,
        relayUrls: defaultRelays,
        icon: formData.icon.trim() || undefined,
        color: undefined
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        hashtags: '',
        icon: ''
      })

      onOpenChange(false)
    } catch (error) {
      // Error already toasted by createChannel
      console.error('Failed to create channel:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new channel to follow specific hashtags and conversations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Name */}
          <div>
            <Label htmlFor="name">
              Channel Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bitcoin Discussion"
              autoFocus
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label htmlFor="hashtags">
              Hashtags <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hashtags"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
              placeholder="bitcoin, btc, lightning"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple hashtags with commas or spaces. Notes matching ANY hashtag will
              appear in this channel.
            </p>
          </div>

          {/* Optional: Icon */}
          <div>
            <Label htmlFor="icon">Icon (optional)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🪙"
              maxLength={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Use an emoji as channel icon</p>
          </div>

          {/* Optional: Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this channel about?"
              rows={2}
            />
          </div>

          {/* Relay info */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">Relays</p>
            <p className="text-xs">
              This channel will use your{' '}
              {favoriteRelayUrls.length > 0 ? 'favorite relays' : 'default relays'}. You can change
              this later in channel settings.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
