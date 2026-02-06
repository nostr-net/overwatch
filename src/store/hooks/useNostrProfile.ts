/**
 * Nostr Profile Hook
 *
 * This hook provides profile-related functionality:
 * - Profile data (profile, profile event, relay list)
 * - Event lists (follow, mute, bookmark, favorite relays, emoji, pin)
 * - Update methods for all profile-related events
 */

import { useAtom } from 'jotai'
import {
  profileAtom,
  profileEventAtom,
  relayListAtom,
  followListEventAtom,
  muteListEventAtom,
  bookmarkListEventAtom,
  favoriteRelaysEventAtom,
  userEmojiListEventAtom,
  pinListEventAtom,
  notificationsSeenAtAtom
} from '../atoms/nostr'
import { Event } from 'nostr-tools'
import indexedDb from '@/services/indexed-db.service'
import { getProfileFromEvent, getRelayListFromEvent } from '@/lib/event-metadata'

export function useNostrProfile() {
  const [profile, setProfile] = useAtom(profileAtom)
  const [profileEvent, setProfileEvent] = useAtom(profileEventAtom)
  const [relayList, setRelayList] = useAtom(relayListAtom)
  const [followListEvent, setFollowListEvent] = useAtom(followListEventAtom)
  const [muteListEvent, setMuteListEvent] = useAtom(muteListEventAtom)
  const [bookmarkListEvent, setBookmarkListEvent] = useAtom(bookmarkListEventAtom)
  const [favoriteRelaysEvent, setFavoriteRelaysEvent] = useAtom(favoriteRelaysEventAtom)
  const [userEmojiListEvent, setUserEmojiListEvent] = useAtom(userEmojiListEventAtom)
  const [pinListEvent, setPinListEvent] = useAtom(pinListEventAtom)
  const [notificationsSeenAt, setNotificationsSeenAt] = useAtom(notificationsSeenAtAtom)

  const updateRelayListEvent = async (relayListEvent: Event) => {
    const newRelayList = await indexedDb.putReplaceableEvent(relayListEvent)
    setRelayList(getRelayListFromEvent(newRelayList))
  }

  const updateProfileEvent = async (profileEvent: Event) => {
    const newProfileEvent = await indexedDb.putReplaceableEvent(profileEvent)
    setProfileEvent(newProfileEvent)
    setProfile(getProfileFromEvent(newProfileEvent))
  }

  const updateFollowListEvent = async (followListEvent: Event) => {
    const newFollowListEvent = await indexedDb.putReplaceableEvent(followListEvent)
    if (newFollowListEvent.id !== followListEvent.id) return
    setFollowListEvent(newFollowListEvent)
  }

  const updateMuteListEvent = async (muteListEvent: Event, privateTags: string[][]) => {
    const newMuteListEvent = await indexedDb.putReplaceableEvent(muteListEvent)
    if (newMuteListEvent.id !== muteListEvent.id) return
    await indexedDb.putMuteDecryptedTags(muteListEvent.id, privateTags)
    setMuteListEvent(muteListEvent)
  }

  const updateBookmarkListEvent = async (bookmarkListEvent: Event) => {
    const newBookmarkListEvent = await indexedDb.putReplaceableEvent(bookmarkListEvent)
    if (newBookmarkListEvent.id !== bookmarkListEvent.id) return
    setBookmarkListEvent(newBookmarkListEvent)
  }

  const updateFavoriteRelaysEvent = async (favoriteRelaysEvent: Event) => {
    const newFavoriteRelaysEvent = await indexedDb.putReplaceableEvent(favoriteRelaysEvent)
    if (newFavoriteRelaysEvent.id !== favoriteRelaysEvent.id) return
    setFavoriteRelaysEvent(newFavoriteRelaysEvent)
  }

  const updatePinListEvent = async (pinListEvent: Event) => {
    const newPinListEvent = await indexedDb.putReplaceableEvent(pinListEvent)
    if (newPinListEvent.id !== pinListEvent.id) return
    setPinListEvent(newPinListEvent)
  }

  return {
    // State
    profile,
    profileEvent,
    relayList,
    followListEvent,
    muteListEvent,
    bookmarkListEvent,
    favoriteRelaysEvent,
    userEmojiListEvent,
    pinListEvent,
    notificationsSeenAt,

    // Actions
    updateRelayListEvent,
    updateProfileEvent,
    updateFollowListEvent,
    updateMuteListEvent,
    updateBookmarkListEvent,
    updateFavoriteRelaysEvent,
    updatePinListEvent,

    // Internal setters (for provider initialization)
    setProfile,
    setProfileEvent,
    setRelayList,
    setFollowListEvent,
    setMuteListEvent,
    setBookmarkListEvent,
    setFavoriteRelaysEvent,
    setUserEmojiListEvent,
    setPinListEvent,
    setNotificationsSeenAt
  }
}
