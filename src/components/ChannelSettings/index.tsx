// ChannelSettings - Edit and manage channel settings
// Created: 2025-11-16

import { useChannel } from '@/providers/ChannelProvider'
import { TChannel } from '@/types/channel'
import { useState } from 'react'
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
import { ArrowUpToLine, Trash2 } from 'lucide-react'
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

export interface ChannelSettingsProps {
  channel: TChannel
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChannelSettings({ channel, open, onOpenChange }: ChannelSettingsProps) {
  const { updateChannel, deleteChannel, keepChannel } = useChannel()
  const [formData, setFormData] = useState({
    name: channel.name,
    description: channel.description || '',
    hashtags: channel.hashtags.join(', '),
    icon: channel.icon || '',
    relayUrls: channel.relayUrls.join('\n')
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const hashtags = formData.hashtags
        .split(/[,\s]+/)
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter((tag) => tag.length > 0)

      const relayUrls = formData.relayUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)

      await updateChannel(channel.id, {
        name: formData.name.trim() || 'Unnamed Channel',
        description: formData.description.trim() || undefined,
        hashtags,
        icon: formData.icon.trim() || undefined,
        relayUrls
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update channel:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteChannel(channel.id)
      setDeleteDialogOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Channel Settings</DialogTitle>
            <DialogDescription>
              Edit channel name, hashtags, and relay configuration
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Channel Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Channel Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bitcoin News"
              />
            </div>

            {/* Channel Icon */}
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., ₿"
                maxLength={2}
              />
            </div>

            {/* Hashtags */}
            <div className="grid gap-2">
              <Label htmlFor="hashtags">Hashtags *</Label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="e.g., bitcoin, btc, crypto"
              />
              <p className="text-xs text-muted-foreground">
                Comma or space separated. The # symbol is optional.
              </p>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's this channel about?"
                rows={2}
              />
            </div>

            {/* Relay URLs */}
            <div className="grid gap-2">
              <Label htmlFor="relays">Relay URLs</Label>
              <Textarea
                id="relays"
                value={formData.relayUrls}
                onChange={(e) => setFormData({ ...formData, relayUrls: e.target.value })}
                placeholder="wss://relay.damus.io&#10;wss://relay.nostr.band"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                One relay per line. Leave empty to use default relays.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
              {channel.autoDiscovered && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    keepChannel(channel.id)
                    onOpenChange(false)
                  }}
                >
                  <ArrowUpToLine className="size-4 mr-2" />
                  Keep Channel
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{channel.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
