/**
 * Follow List Hook
 *
 * Provides functionality to:
 * - Get the set of followed pubkeys
 * - Follow/unfollow users
 */

import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { followingSetAtom } from '@/store/atoms/content'
import { useNostr } from '@/providers/NostrProvider'
import { createFollowListDraftEvent } from '@/lib/draft-event'
import { getPubkeysFromPTags } from '@/lib/tag'
import client from '@/services/client.service'

export function useFollowList() {
  const { t } = useTranslation()
  const { pubkey: accountPubkey, followListEvent, publish, updateFollowListEvent } = useNostr()
  const [followingSet, setFollowingSet] = useAtom(followingSetAtom)

  // Sync followingSet with followListEvent
  const derivedFollowingSet = useMemo(
    () => new Set(followListEvent ? getPubkeysFromPTags(followListEvent.tags) : []),
    [followListEvent]
  )

  useEffect(() => {
    setFollowingSet(derivedFollowingSet)
  }, [derivedFollowingSet, setFollowingSet])

  const follow = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey) return

      const followListEvent = await client.fetchFollowListEvent(accountPubkey)
      if (!followListEvent) {
        const result = confirm(t('FollowListNotFoundConfirmation'))

        if (!result) {
          return
        }
      }
      const newFollowListDraftEvent = createFollowListDraftEvent(
        (followListEvent?.tags ?? []).concat([['p', pubkey]]),
        followListEvent?.content
      )
      const newFollowListEvent = await publish(newFollowListDraftEvent)
      await updateFollowListEvent(newFollowListEvent)
    },
    [accountPubkey, publish, updateFollowListEvent, t]
  )

  const unfollow = useCallback(
    async (pubkey: string) => {
      if (!accountPubkey) return

      const followListEvent = await client.fetchFollowListEvent(accountPubkey)
      if (!followListEvent) return

      const newFollowListDraftEvent = createFollowListDraftEvent(
        followListEvent.tags.filter(([tagName, tagValue]) => tagName !== 'p' || tagValue !== pubkey),
        followListEvent.content
      )
      const newFollowListEvent = await publish(newFollowListDraftEvent)
      await updateFollowListEvent(newFollowListEvent)
    },
    [accountPubkey, publish, updateFollowListEvent]
  )

  return {
    followingSet,
    follow,
    unfollow
  }
}
