import RelaySelectionDialog, { getStoredInitialRelays } from '@/components/RelaySelectionDialog'
import { useFavoriteRelays } from '@/providers/FavoriteRelaysProvider'
import { useNostr } from '@/providers/NostrProvider'
import { useEffect, useState } from 'react'

export default function InitialRelaySetup() {
  const { isInitialized, pubkey } = useNostr()
  const { favoriteRelays } = useFavoriteRelays()
  const [showDialog, setShowDialog] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Only check once when the app is initialized
    if (!isInitialized || hasChecked) return

    setHasChecked(true)

    // If user is logged in, don't show the dialog
    if (pubkey) return

    // If user has favorite relays, don't show the dialog
    if (favoriteRelays.length > 0) return

    // Check if initial relays were already selected
    const storedInitialRelays = getStoredInitialRelays()
    if (storedInitialRelays && storedInitialRelays.length > 0) return

    // Show the dialog
    setShowDialog(true)
  }, [isInitialized, pubkey, favoriteRelays, hasChecked])

  const handleComplete = () => {
    setShowDialog(false)
    // Reload the page to apply the new relays
    window.location.reload()
  }

  return <RelaySelectionDialog open={showDialog} onComplete={handleComplete} />
}
