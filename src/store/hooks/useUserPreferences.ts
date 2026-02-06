/**
 * User Preferences Hook (Jotai-based)
 *
 * This hook provides access to user preferences state using Jotai atoms.
 * It replaces the old UserPreferencesProvider Context API implementation.
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import storage from '@/services/local-storage.service'
import { TNotificationStyle } from '@/types'
import {
  notificationListStyleAtom,
  muteMediaAtom,
  sidebarCollapseAtom,
  enableSingleColumnLayoutAtom,
  effectiveSingleColumnLayoutAtom,
  isSmallScreenAtom,
  updateLayoutOverflowAtom
} from '../atoms/user'

export function useUserPreferences() {
  const [notificationListStyle, setNotificationListStyleRaw] = useAtom(notificationListStyleAtom)
  const [muteMedia, setMuteMedia] = useAtom(muteMediaAtom)
  const [sidebarCollapse, setSidebarCollapseRaw] = useAtom(sidebarCollapseAtom)
  const [enableSingleColumnLayout, setEnableSingleColumnLayoutRaw] = useAtom(enableSingleColumnLayoutAtom)
  const effectiveSingleColumnLayout = useAtomValue(effectiveSingleColumnLayoutAtom)
  const isSmallScreen = useAtomValue(isSmallScreenAtom)
  const updateLayoutOverflow = useSetAtom(updateLayoutOverflowAtom)

  // Sync layout overflow when layout settings change
  useEffect(() => {
    updateLayoutOverflow()
  }, [enableSingleColumnLayout, isSmallScreen, updateLayoutOverflow])

  // Wrapper functions that also update localStorage
  const updateNotificationListStyle = (style: TNotificationStyle) => {
    setNotificationListStyleRaw(style)
    storage.setNotificationListStyle(style)
  }

  const updateSidebarCollapse = (collapse: boolean) => {
    setSidebarCollapseRaw(collapse)
    storage.setSidebarCollapse(collapse)
  }

  const updateEnableSingleColumnLayout = (enable: boolean) => {
    setEnableSingleColumnLayoutRaw(enable)
    storage.setEnableSingleColumnLayout(enable)
  }

  return {
    notificationListStyle,
    updateNotificationListStyle,
    muteMedia,
    updateMuteMedia: setMuteMedia,
    sidebarCollapse,
    updateSidebarCollapse,
    enableSingleColumnLayout: effectiveSingleColumnLayout,
    updateEnableSingleColumnLayout
  }
}
