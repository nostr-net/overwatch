// ProfileEditDialog - Full profile editor in a dialog
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
import { useNostr } from '@/providers/NostrProvider'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import client from '@/services/client.service'

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export default function ProfileEditDialog({
  open,
  onOpenChange,
  onSave
}: ProfileEditDialogProps) {
  const { pubkey, publish } = useNostr()
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    picture: '',
    website: '',
    lud16: ''
  })

  // Load current profile data when dialog opens
  useEffect(() => {
    const loadProfile = async () => {
      if (open && pubkey) {
        try {
          const profile = await client.fetchProfile(pubkey)
          if (profile) {
            setFormData({
              name: profile.username || '',
              about: profile.about || '',
              picture: profile.avatar || '',
              website: profile.website || '',
              lud16: profile.lud16 || ''
            })
          }
        } catch (error) {
          console.error('Failed to load profile:', error)
          // Keep empty form on error
        }
      }
    }
    loadProfile()
  }, [open, pubkey])

  const handleSave = async () => {
    if (!pubkey) return

    setSaving(true)
    try {
      const event = {
        kind: 0,
        content: JSON.stringify({
          name: formData.name,
          about: formData.about,
          picture: formData.picture,
          website: formData.website,
          lud16: formData.lud16
        }),
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      }

      await publish(event)

      toast.success('Profile updated successfully')
      onSave?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your Nostr profile information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Your name"
            />
          </div>

          {/* About */}
          <div>
            <Label htmlFor="about">Bio</Label>
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) =>
                setFormData({ ...formData, about: e.target.value })
              }
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          {/* Profile Picture */}
          <div>
            <Label htmlFor="picture">Profile Picture URL</Label>
            <Input
              id="picture"
              type="url"
              value={formData.picture}
              onChange={(e) =>
                setFormData({ ...formData, picture: e.target.value })
              }
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://example.com"
            />
          </div>

          {/* Lightning Address */}
          <div>
            <Label htmlFor="lud16">Lightning Address</Label>
            <Input
              id="lud16"
              value={formData.lud16}
              onChange={(e) =>
                setFormData({ ...formData, lud16: e.target.value })
              }
              placeholder="you@getalby.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
