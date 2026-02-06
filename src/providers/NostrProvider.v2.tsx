/**
 * NostrProvider v2 - Jotai-based Bridge Provider
 *
 * This provider maintains backward compatibility with the Context API
 * while using Jotai atoms under the hood for state management.
 *
 * Migration Status: Sprint 3 Complete
 * - Auth atoms/hooks
 * - Profile atoms/hooks
 * - Publishing atoms/hooks
 */

import LoginDialog from '@/components/LoginDialog'
import { ApplicationDataKey, BIG_RELAY_URLS, ExtendedKind } from '@/constants'
import {
  createSeenNotificationsAtDraftEvent
} from '@/lib/draft-event'
import { getLatestEvent, getReplaceableEventIdentifier } from '@/lib/event'
import { getProfileFromEvent, getRelayListFromEvent } from '@/lib/event-metadata'
import { formatPubkey, pubkeyToNpub } from '@/lib/pubkey'
import client from '@/services/client.service'
import customEmojiService from '@/services/custom-emoji.service'
import indexedDb from '@/services/indexed-db.service'
import storage from '@/services/local-storage.service'
import noteStatsService from '@/services/note-stats.service'
import { TAccountPointer, TDraftEvent, TPublishOptions } from '@/types'
import dayjs from 'dayjs'
import { Event, kinds } from 'nostr-tools'
import { createContext, useContext, useEffect, useState } from 'react'
import { useDeletedEvent } from './DeletedEventProvider'
import { useNostrAuth } from '@/store/hooks/useNostrAuth'
import { useNostrProfile } from '@/store/hooks/useNostrProfile'
import { useNostrPublishing } from '@/store/hooks/useNostrPublishing'
import { useAtomValue } from 'jotai'
import { loginDialogOpenAtom } from '@/store/atoms/nostr'

// Context type matches original NostrProvider
type TNostrContext = {
  isInitialized: boolean
  pubkey: string | null
  profile: any
  profileEvent: Event | null
  relayList: any
  followListEvent: Event | null
  muteListEvent: Event | null
  bookmarkListEvent: Event | null
  favoriteRelaysEvent: Event | null
  userEmojiListEvent: Event | null
  pinListEvent: Event | null
  notificationsSeenAt: number
  account: TAccountPointer | null
  accounts: TAccountPointer[]
  nsec: string | null
  ncryptsec: string | null
  switchAccount: (account: TAccountPointer | null) => Promise<void>
  nsecLogin: (nsec: string, password?: string, needSetup?: boolean) => Promise<string>
  ncryptsecLogin: (ncryptsec: string) => Promise<string>
  nip07Login: () => Promise<string>
  bunkerLogin: (bunker: string) => Promise<string>
  nostrConnectionLogin: (clientSecretKey: Uint8Array, connectionString: string) => Promise<string>
  npubLogin(npub: string): Promise<string>
  removeAccount: (account: TAccountPointer) => void
  publish: (draftEvent: TDraftEvent, options?: TPublishOptions) => Promise<Event>
  attemptDelete: (targetEvent: Event) => Promise<void>
  signHttpAuth: (url: string, method: string) => Promise<string>
  signEvent: (draftEvent: TDraftEvent) => Promise<any>
  nip04Encrypt: (pubkey: string, plainText: string) => Promise<string>
  nip04Decrypt: (pubkey: string, cipherText: string) => Promise<string>
  startLogin: () => void
  checkLogin: <T>(cb?: () => T) => Promise<T | void>
  updateRelayListEvent: (relayListEvent: Event) => Promise<void>
  updateProfileEvent: (profileEvent: Event) => Promise<void>
  updateFollowListEvent: (followListEvent: Event) => Promise<void>
  updateMuteListEvent: (muteListEvent: Event, privateTags: string[][]) => Promise<void>
  updateBookmarkListEvent: (bookmarkListEvent: Event) => Promise<void>
  updateFavoriteRelaysEvent: (favoriteRelaysEvent: Event) => Promise<void>
  updatePinListEvent: (pinListEvent: Event) => Promise<void>
  updateNotificationsSeenAt: (skipPublish?: boolean) => Promise<void>
}

const NostrContext = createContext<TNostrContext | undefined>(undefined)

const lastPublishedSeenNotificationsAtEventAtMap = new Map<string, number>()

export const useNostr = () => {
  const context = useContext(NostrContext)
  if (!context) {
    throw new Error('useNostr must be used within a NostrProvider')
  }
  return context
}

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const { addDeletedEvent } = useDeletedEvent()

  // Use Jotai hooks
  const auth = useNostrAuth()
  const profile = useNostrProfile()
  const publishing = useNostrPublishing()
  const openLoginDialog = useAtomValue(loginDialogOpenAtom)
  const [localOpenLoginDialog, setLocalOpenLoginDialog] = useState(false)

  // Initialization logic
  useEffect(() => {
    const init = async () => {
      if (hasNostrLoginHash()) {
        return await loginByNostrLoginHash()
      }

      const accounts = storage.getAccounts()
      const act = storage.getCurrentAccount() ?? accounts[0]
      if (!act) return

      await auth.switchAccount({ pubkey: act.pubkey, signerType: act.signerType })
    }
    init().then(() => {
      auth.setIsInitialized(true)
    })

    const handleHashChange = () => {
      if (hasNostrLoginHash()) {
        loginByNostrLoginHash()
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Load user data when account changes
  useEffect(() => {
    const init = async () => {
      profile.setRelayList(null)
      profile.setProfile(null)
      profile.setProfileEvent(null)
      auth.setNsec(null)
      profile.setFavoriteRelaysEvent(null)
      profile.setFollowListEvent(null)
      profile.setMuteListEvent(null)
      profile.setBookmarkListEvent(null)
      profile.setPinListEvent(null)
      profile.setNotificationsSeenAt(-1)

      if (!auth.account) return

      const controller = new AbortController()
      const storedNsec = storage.getAccountNsec(auth.account.pubkey)
      if (storedNsec) {
        auth.setNsec(storedNsec)
      }
      const storedNcryptsec = storage.getAccountNcryptsec(auth.account.pubkey)
      if (storedNcryptsec) {
        auth.setNcryptsec(storedNcryptsec)
      }

      const storedNotificationsSeenAt = storage.getLastReadNotificationTime(auth.account.pubkey)

      const [
        storedRelayListEvent,
        storedProfileEvent,
        storedFollowListEvent,
        storedMuteListEvent,
        storedBookmarkListEvent,
        storedFavoriteRelaysEvent,
        storedUserEmojiListEvent,
        storedPinListEvent
      ] = await Promise.all([
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.RelayList),
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.Metadata),
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.Contacts),
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.Mutelist),
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.BookmarkList),
        indexedDb.getReplaceableEvent(auth.account.pubkey, ExtendedKind.FAVORITE_RELAYS),
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.UserEmojiList),
        indexedDb.getReplaceableEvent(auth.account.pubkey, kinds.Pinlist)
      ])

      if (storedRelayListEvent) {
        profile.setRelayList(getRelayListFromEvent(storedRelayListEvent))
      }
      if (storedProfileEvent) {
        profile.setProfileEvent(storedProfileEvent)
        profile.setProfile(getProfileFromEvent(storedProfileEvent))
      }
      if (storedFollowListEvent) {
        profile.setFollowListEvent(storedFollowListEvent)
      }
      if (storedMuteListEvent) {
        profile.setMuteListEvent(storedMuteListEvent)
      }
      if (storedBookmarkListEvent) {
        profile.setBookmarkListEvent(storedBookmarkListEvent)
      }
      if (storedFavoriteRelaysEvent) {
        profile.setFavoriteRelaysEvent(storedFavoriteRelaysEvent)
      }
      if (storedUserEmojiListEvent) {
        profile.setUserEmojiListEvent(storedUserEmojiListEvent)
      }
      if (storedPinListEvent) {
        profile.setPinListEvent(storedPinListEvent)
      }

      const relayListEvents = await client.fetchEvents(BIG_RELAY_URLS, {
        kinds: [kinds.RelayList],
        authors: [auth.account.pubkey]
      })
      const relayListEvent = getLatestEvent(relayListEvents) ?? storedRelayListEvent
      const relayList = getRelayListFromEvent(relayListEvent)
      if (relayListEvent) {
        client.updateRelayListCache(relayListEvent)
        await indexedDb.putReplaceableEvent(relayListEvent)
      }
      profile.setRelayList(relayList)

      const events = await client.fetchEvents(relayList.write.concat(BIG_RELAY_URLS).slice(0, 4), [
        {
          kinds: [
            kinds.Metadata,
            kinds.Contacts,
            kinds.Mutelist,
            kinds.BookmarkList,
            ExtendedKind.FAVORITE_RELAYS,
            ExtendedKind.BLOSSOM_SERVER_LIST,
            kinds.UserEmojiList,
            kinds.Pinlist
          ],
          authors: [auth.account.pubkey]
        },
        {
          kinds: [kinds.Application],
          authors: [auth.account.pubkey],
          '#d': [ApplicationDataKey.NOTIFICATIONS_SEEN_AT]
        }
      ])

      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at)
      const profileEvent = sortedEvents.find((e) => e.kind === kinds.Metadata)
      const followListEvent = sortedEvents.find((e) => e.kind === kinds.Contacts)
      const muteListEvent = sortedEvents.find((e) => e.kind === kinds.Mutelist)
      const bookmarkListEvent = sortedEvents.find((e) => e.kind === kinds.BookmarkList)
      const favoriteRelaysEvent = sortedEvents.find((e) => e.kind === ExtendedKind.FAVORITE_RELAYS)
      const blossomServerListEvent = sortedEvents.find(
        (e) => e.kind === ExtendedKind.BLOSSOM_SERVER_LIST
      )
      const userEmojiListEvent = sortedEvents.find((e) => e.kind === kinds.UserEmojiList)
      const notificationsSeenAtEvent = sortedEvents.find(
        (e) =>
          e.kind === kinds.Application &&
          getReplaceableEventIdentifier(e) === ApplicationDataKey.NOTIFICATIONS_SEEN_AT
      )
      const pinnedNotesEvent = sortedEvents.find((e) => e.kind === kinds.Pinlist)

      if (profileEvent) {
        const updatedProfileEvent = await indexedDb.putReplaceableEvent(profileEvent)
        if (updatedProfileEvent.id === profileEvent.id) {
          profile.setProfileEvent(updatedProfileEvent)
          profile.setProfile(getProfileFromEvent(updatedProfileEvent))
        }
      } else if (!storedProfileEvent) {
        profile.setProfile({
          pubkey: auth.account.pubkey,
          npub: pubkeyToNpub(auth.account.pubkey) ?? '',
          username: formatPubkey(auth.account.pubkey)
        })
      }
      if (followListEvent) {
        const updatedFollowListEvent = await indexedDb.putReplaceableEvent(followListEvent)
        if (updatedFollowListEvent.id === followListEvent.id) {
          profile.setFollowListEvent(followListEvent)
        }
      }
      if (muteListEvent) {
        const updatedMuteListEvent = await indexedDb.putReplaceableEvent(muteListEvent)
        if (updatedMuteListEvent.id === muteListEvent.id) {
          profile.setMuteListEvent(muteListEvent)
        }
      }
      if (bookmarkListEvent) {
        const updateBookmarkListEvent = await indexedDb.putReplaceableEvent(bookmarkListEvent)
        if (updateBookmarkListEvent.id === bookmarkListEvent.id) {
          profile.setBookmarkListEvent(bookmarkListEvent)
        }
      }
      if (favoriteRelaysEvent) {
        const updatedFavoriteRelaysEvent = await indexedDb.putReplaceableEvent(favoriteRelaysEvent)
        if (updatedFavoriteRelaysEvent.id === favoriteRelaysEvent.id) {
          profile.setFavoriteRelaysEvent(updatedFavoriteRelaysEvent)
        }
      }
      if (blossomServerListEvent) {
        await client.updateBlossomServerListEventCache(blossomServerListEvent)
      }
      if (userEmojiListEvent) {
        const updatedUserEmojiListEvent = await indexedDb.putReplaceableEvent(userEmojiListEvent)
        if (updatedUserEmojiListEvent.id === userEmojiListEvent.id) {
          profile.setUserEmojiListEvent(updatedUserEmojiListEvent)
        }
      }
      if (pinnedNotesEvent) {
        const updatedPinnedNotesEvent = await indexedDb.putReplaceableEvent(pinnedNotesEvent)
        if (updatedPinnedNotesEvent.id === pinnedNotesEvent.id) {
          profile.setPinListEvent(updatedPinnedNotesEvent)
        }
      }

      const notificationsSeenAt = Math.max(
        notificationsSeenAtEvent?.created_at ?? 0,
        storedNotificationsSeenAt
      )
      profile.setNotificationsSeenAt(notificationsSeenAt)
      storage.setLastReadNotificationTime(auth.account.pubkey, notificationsSeenAt)

      client.initUserIndexFromFollowings(auth.account.pubkey, controller.signal)
      return controller
    }

    const promise = init()
    return () => {
      promise.then((controller) => controller?.abort())
    }
  }, [auth.account])

  // Initialize interactions
  useEffect(() => {
    if (!auth.account) return

    const initInteractions = async () => {
      const pubkey = auth.account!.pubkey
      const relayList = await client.fetchRelayList(pubkey)
      const events = await client.fetchEvents(relayList.write.slice(0, 4), [
        {
          authors: [pubkey],
          kinds: [kinds.Reaction, kinds.Repost],
          limit: 100
        },
        {
          '#P': [pubkey],
          kinds: [kinds.Zap],
          limit: 100
        }
      ])
      noteStatsService.updateNoteStatsByEvents(events)
    }
    initInteractions()
  }, [auth.account])

  // Update client signer
  useEffect(() => {
    if (auth.signer) {
      client.signer = auth.signer
    } else {
      client.signer = undefined
    }
  }, [auth.signer])

  // Update client pubkey
  useEffect(() => {
    if (auth.account) {
      client.pubkey = auth.account.pubkey
    } else {
      client.pubkey = undefined
    }
  }, [auth.account])

  // Initialize custom emoji service
  useEffect(() => {
    customEmojiService.init(profile.userEmojiListEvent)
  }, [profile.userEmojiListEvent])

  const hasNostrLoginHash = () => {
    return window.location.hash && window.location.hash.startsWith('#nostr-login')
  }

  const loginByNostrLoginHash = async () => {
    const credential = window.location.hash.replace('#nostr-login=', '')
    const urlWithoutHash = window.location.href.split('#')[0]
    history.replaceState(null, '', urlWithoutHash)

    if (credential.startsWith('bunker://')) {
      return await auth.bunkerLogin(credential)
    } else if (credential.startsWith('ncryptsec')) {
      return await auth.ncryptsecLogin(credential)
    } else if (credential.startsWith('nsec')) {
      return await auth.nsecLogin(credential)
    }
  }


  const updateNotificationsSeenAt = async (skipPublish = false) => {
    if (!auth.account) return

    const now = dayjs().unix()
    storage.setLastReadNotificationTime(auth.account.pubkey, now)
    setTimeout(() => {
      profile.setNotificationsSeenAt(now)
    }, 5_000)

    const lastPublishedSeenNotificationsAtEventAt =
      lastPublishedSeenNotificationsAtEventAtMap.get(auth.account.pubkey) ?? -1
    if (
      !skipPublish &&
      (lastPublishedSeenNotificationsAtEventAt < 0 ||
        now - lastPublishedSeenNotificationsAtEventAt > 10 * 60)
    ) {
      await publishing.publish(createSeenNotificationsAtDraftEvent())
      lastPublishedSeenNotificationsAtEventAtMap.set(auth.account.pubkey, now)
    }
  }

  const attemptDeleteWrapper = async (targetEvent: Event) => {
    await publishing.attemptDelete(targetEvent, addDeletedEvent)
  }

  return (
    <NostrContext.Provider
      value={{
        isInitialized: auth.isInitialized,
        pubkey: auth.pubkey,
        profile: profile.profile,
        profileEvent: profile.profileEvent,
        relayList: profile.relayList,
        followListEvent: profile.followListEvent,
        muteListEvent: profile.muteListEvent,
        bookmarkListEvent: profile.bookmarkListEvent,
        favoriteRelaysEvent: profile.favoriteRelaysEvent,
        userEmojiListEvent: profile.userEmojiListEvent,
        pinListEvent: profile.pinListEvent,
        notificationsSeenAt: profile.notificationsSeenAt,
        account: auth.account,
        accounts: auth.accounts,
        nsec: auth.nsec,
        ncryptsec: auth.ncryptsec,
        switchAccount: auth.switchAccount,
        nsecLogin: auth.nsecLogin,
        ncryptsecLogin: auth.ncryptsecLogin,
        nip07Login: auth.nip07Login,
        bunkerLogin: auth.bunkerLogin,
        nostrConnectionLogin: auth.nostrConnectionLogin,
        npubLogin: auth.npubLogin,
        removeAccount: auth.removeAccount,
        publish: publishing.publish,
        attemptDelete: attemptDeleteWrapper,
        signHttpAuth: publishing.signHttpAuth,
        nip04Encrypt: publishing.nip04Encrypt,
        nip04Decrypt: publishing.nip04Decrypt,
        startLogin: auth.startLogin,
        checkLogin: auth.checkLogin,
        signEvent: publishing.signEvent,
        updateRelayListEvent: profile.updateRelayListEvent,
        updateProfileEvent: profile.updateProfileEvent,
        updateFollowListEvent: profile.updateFollowListEvent,
        updateMuteListEvent: profile.updateMuteListEvent,
        updateBookmarkListEvent: profile.updateBookmarkListEvent,
        updateFavoriteRelaysEvent: profile.updateFavoriteRelaysEvent,
        updatePinListEvent: profile.updatePinListEvent,
        updateNotificationsSeenAt
      }}
    >
      {children}
      <LoginDialog open={openLoginDialog || localOpenLoginDialog} setOpen={setLocalOpenLoginDialog} />
    </NostrContext.Provider>
  )
}
