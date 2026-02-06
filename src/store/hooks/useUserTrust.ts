/**
 * User Trust Hook
 *
 * Provides functionality to:
 * - Check if a user is trusted (in the Web of Trust)
 * - Manage hide untrusted content settings
 * - Build and maintain Web of Trust (WoT)
 */

import { useAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import {
  hideUntrustedInteractionsAtom,
  hideUntrustedNotificationsAtom,
  hideUntrustedNotesAtom,
  wotSetAtom
} from '@/store/atoms/content'
import { useNostr } from '@/providers/NostrProvider'
import client from '@/services/client.service'
import storage from '@/services/local-storage.service'

export function useUserTrust() {
  const { pubkey: currentPubkey } = useNostr()
  const [hideUntrustedInteractions, setHideUntrustedInteractions] = useAtom(
    hideUntrustedInteractionsAtom
  )
  const [hideUntrustedNotifications, setHideUntrustedNotifications] = useAtom(
    hideUntrustedNotificationsAtom
  )
  const [hideUntrustedNotes, setHideUntrustedNotes] = useAtom(hideUntrustedNotesAtom)
  const [wotSet, setWotSet] = useAtom(wotSetAtom)

  // Build Web of Trust when user logs in
  useEffect(() => {
    if (!currentPubkey) return

    const initWoT = async () => {
      const followings = await client.fetchFollowings(currentPubkey)

      // Add direct followings to WoT
      const newWotSet = new Set<string>(followings)

      // Fetch followings of followings (2 degrees of separation)
      const batchSize = 20
      for (let i = 0; i < followings.length; i += batchSize) {
        const batch = followings.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map(async (pubkey) => {
            const _followings = await client.fetchFollowings(pubkey)
            _followings.forEach((following) => {
              newWotSet.add(following)
            })
          })
        )
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setWotSet(newWotSet)
    }
    initWoT()
  }, [currentPubkey, setWotSet])

  const isUserTrusted = useCallback(
    (pubkey: string) => {
      if (!currentPubkey || pubkey === currentPubkey) return true
      return wotSet.has(pubkey)
    },
    [currentPubkey, wotSet]
  )

  const updateHideUntrustedInteractions = useCallback(
    (hide: boolean) => {
      setHideUntrustedInteractions(hide)
      storage.setHideUntrustedInteractions(hide)
    },
    [setHideUntrustedInteractions]
  )

  const updateHideUntrustedNotifications = useCallback(
    (hide: boolean) => {
      setHideUntrustedNotifications(hide)
      storage.setHideUntrustedNotifications(hide)
    },
    [setHideUntrustedNotifications]
  )

  const updateHideUntrustedNotes = useCallback(
    (hide: boolean) => {
      setHideUntrustedNotes(hide)
      storage.setHideUntrustedNotes(hide)
    },
    [setHideUntrustedNotes]
  )

  return {
    hideUntrustedInteractions,
    hideUntrustedNotifications,
    hideUntrustedNotes,
    updateHideUntrustedInteractions,
    updateHideUntrustedNotifications,
    updateHideUntrustedNotes,
    isUserTrusted
  }
}
