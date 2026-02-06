/**
 * UserPreferencesProvider (Jotai-based)
 *
 * This is a bridge provider that uses Jotai atoms internally
 * but maintains the same Context API interface for backward compatibility.
 *
 * Eventually, consumers should migrate to using the Jotai hooks directly
 * and this provider can be removed.
 */

import { createContext, useContext } from 'react'
import { useUserPreferences as useJotaiUserPreferences } from '@/store/hooks/useUserPreferences'
import { TNotificationStyle } from '@/types'

type TUserPreferencesContext = {
  notificationListStyle: TNotificationStyle
  updateNotificationListStyle: (style: TNotificationStyle) => void

  muteMedia: boolean
  updateMuteMedia: (mute: boolean) => void

  sidebarCollapse: boolean
  updateSidebarCollapse: (collapse: boolean) => void

  enableSingleColumnLayout: boolean
  updateEnableSingleColumnLayout: (enable: boolean) => void
}

const UserPreferencesContext = createContext<TUserPreferencesContext | undefined>(undefined)

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai-based hook internally
  const preferences = useJotaiUserPreferences()

  return (
    <UserPreferencesContext.Provider value={preferences}>
      {children}
    </UserPreferencesContext.Provider>
  )
}
