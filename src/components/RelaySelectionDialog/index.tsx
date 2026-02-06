import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { LOCKED_RELAY } from '@/constants'
import { normalizeUrl } from '@/lib/url'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const STORAGE_KEY = 'initialRelays'

export default function RelaySelectionDialog({
  open,
  onComplete,
  onClose,
  initialRelays
}: {
  open: boolean
  onComplete: (relays: string[]) => void
  onClose?: () => void
  initialRelays?: string[]
}) {
  const { t } = useTranslation()
  const { isSmallScreen } = useScreenSize()
  const [selectedRelays, setSelectedRelays] = useState<Set<string>>(() => {
    if (LOCKED_RELAY) {
      return new Set([LOCKED_RELAY])
    }
    if (initialRelays && initialRelays.length > 0) {
      return new Set(initialRelays)
    }
    return new Set()
  })
  const [customRelay, setCustomRelay] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open) {
      if (LOCKED_RELAY) {
        setSelectedRelays(new Set([LOCKED_RELAY]))
      } else if (initialRelays && initialRelays.length > 0) {
        setSelectedRelays(new Set(initialRelays))
      } else {
        setSelectedRelays(new Set())
      }
      setCustomRelay('')
      setErrorMsg('')
    }
  }, [open, initialRelays])

  const removeRelay = (relay: string) => {
    if (LOCKED_RELAY && relay === LOCKED_RELAY) {
      return
    }
    const newSelected = new Set(selectedRelays)
    newSelected.delete(relay)
    setSelectedRelays(newSelected)
  }

  const addCustomRelay = () => {
    if (!customRelay) return
    const normalized = normalizeUrl(customRelay)
    if (!normalized) {
      setErrorMsg(t('Invalid URL'))
      return
    }
    if (LOCKED_RELAY && normalized !== LOCKED_RELAY) {
      setErrorMsg(t('Relay is locked to specific configuration'))
      return
    }
    if (selectedRelays.has(normalized)) {
      setErrorMsg(t('Already added'))
      return
    }
    const newSelected = new Set(selectedRelays)
    newSelected.add(normalized)
    setSelectedRelays(newSelected)
    setCustomRelay('')
    setErrorMsg('')
  }

  const handleComplete = () => {
    if (selectedRelays.size === 0) {
      setErrorMsg(t('Please select at least one relay'))
      return
    }
    const relays = Array.from(selectedRelays)
    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relays))
    onComplete(relays)
  }

  const content = (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        {t('Select relays to connect to the Nostr network')}
      </div>

      {selectedRelays.size > 0 && (
        <div className="space-y-2">
          <div className="font-semibold text-sm">{t('Currently Selected Relays')}</div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {Array.from(selectedRelays).map((relay) => (
              <div key={relay} className="flex items-center justify-between gap-2 p-2 bg-secondary/50 rounded">
                <span className="text-sm flex-1 truncate" title={relay}>
                  {relay}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRelay(relay)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="font-semibold text-sm">{t('Add Custom Relay')}</div>
        <div className="flex gap-2">
          <Input
            placeholder="wss://relay.example.com"
            value={customRelay}
            onChange={(e) => {
              setCustomRelay(e.target.value)
              setErrorMsg('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomRelay()
              }
            }}
            className={errorMsg ? 'border-destructive' : ''}
          />
          <Button onClick={addCustomRelay}>{t('Add')}</Button>
        </div>
        {errorMsg && <div className="text-destructive text-sm">{errorMsg}</div>}
      </div>

      <div className="text-sm text-muted-foreground">
        {t('Selected')}: {selectedRelays.size}
      </div>

      <Button onClick={handleComplete} className="w-full">
        {t('Continue')}
      </Button>
    </div>
  )

  if (isSmallScreen) {
    return (
      <Drawer open={open} onOpenChange={(open) => !open && onClose?.()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('Select Relays')}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">{content}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Select Relays')}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

export function getStoredInitialRelays(): string[] | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}
