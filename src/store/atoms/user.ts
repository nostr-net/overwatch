/**
 * User Domain Atoms
 *
 * This file contains atoms for:
 * - User Preferences (notification style, mute media, sidebar, layout)
 * - Theme (theme setting, primary color)
 * - Screen Size (responsive breakpoints)
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import storage from '@/services/local-storage.service'
import { TNotificationStyle, TThemeSetting, TTheme } from '@/types'
import { TPrimaryColor, PRIMARY_COLORS, StorageKey } from '@/constants'

// ============================================================================
// User Preferences Atoms
// ============================================================================

/**
 * Notification list display style (compact or detailed)
 */
export const notificationListStyleAtom = atomWithStorage<TNotificationStyle>(
  StorageKey.NOTIFICATION_LIST_STYLE,
  storage.getNotificationListStyle()
)

/**
 * Whether to mute media by default
 */
export const muteMediaAtom = atom<boolean>(true)

/**
 * Whether the sidebar is collapsed
 */
export const sidebarCollapseAtom = atomWithStorage<boolean>(
  StorageKey.SIDEBAR_COLLAPSE,
  storage.getSidebarCollapse()
)

/**
 * Whether single column layout is enabled
 */
export const enableSingleColumnLayoutAtom = atomWithStorage<boolean>(
  StorageKey.ENABLE_SINGLE_COLUMN_LAYOUT,
  storage.getEnableSingleColumnLayout()
)

// ============================================================================
// Theme Atoms
// ============================================================================

/**
 * User's theme setting preference (light, dark, system, pure-black)
 */
export const themeSettingAtom = atomWithStorage<TThemeSetting>(
  StorageKey.THEME_SETTING,
  (localStorage.getItem(StorageKey.THEME_SETTING) as TThemeSetting) ?? 'system'
)

/**
 * Primary color theme
 */
export const primaryColorAtom = atomWithStorage<TPrimaryColor>(
  StorageKey.PRIMARY_COLOR,
  (localStorage.getItem(StorageKey.PRIMARY_COLOR) as TPrimaryColor) ?? 'DEFAULT'
)

/**
 * Computed theme based on theme setting and system preference
 * This is a read-only derived atom
 */
export const currentThemeAtom = atom<TTheme>((get) => {
  const themeSetting = get(themeSettingAtom)

  if (themeSetting !== 'system') {
    return themeSetting
  }

  // For 'system' theme, check the media query
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    return mediaQuery.matches ? 'dark' : 'light'
  }

  return 'light'
})

/**
 * Write-only atom to update CSS variables for theme
 * This handles the side effect of updating the DOM
 */
export const updateThemeCSSAtom = atom(
  null,
  (get, _set) => {
    const theme = get(currentThemeAtom)
    const primaryColor = get(primaryColorAtom)

    const root = window.document.documentElement

    // Update theme classes
    root.classList.remove('light', 'dark', 'pure-black')
    root.classList.add(theme === 'pure-black' ? 'dark' : theme)

    if (theme === 'pure-black') {
      root.classList.add('pure-black')
    }

    // Update primary color CSS variables
    const colorConfig = PRIMARY_COLORS[primaryColor] ?? PRIMARY_COLORS.DEFAULT
    const config = theme === 'light' ? colorConfig.light : colorConfig.dark

    root.style.setProperty('--primary', config.primary)
    root.style.setProperty('--primary-hover', config['primary-hover'])
    root.style.setProperty('--primary-foreground', config['primary-foreground'])
    root.style.setProperty('--ring', config.ring)
  }
)

// ============================================================================
// Screen Size Atoms
// ============================================================================

/**
 * Whether the current screen is small (<=768px)
 */
export const isSmallScreenAtom = atom<boolean>(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
})

/**
 * Whether the current screen is large (>=1280px)
 */
export const isLargeScreenAtom = atom<boolean>(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1280
})

/**
 * Effective single column layout setting
 * On small screens, single column is always enabled
 */
export const effectiveSingleColumnLayoutAtom = atom<boolean>((get) => {
  const isSmallScreen = get(isSmallScreenAtom)
  const enableSingleColumnLayout = get(enableSingleColumnLayoutAtom)
  return isSmallScreen ? true : enableSingleColumnLayout
})

/**
 * Write-only atom to update document overflow based on layout
 * This handles the side effect of updating document styles
 */
export const updateLayoutOverflowAtom = atom(
  null,
  (get, _set) => {
    const isSmallScreen = get(isSmallScreenAtom)
    const enableSingleColumnLayout = get(enableSingleColumnLayoutAtom)

    if (!isSmallScreen && enableSingleColumnLayout) {
      document.documentElement.style.setProperty('overflow-y', 'scroll')
    } else {
      document.documentElement.style.removeProperty('overflow-y')
    }
  }
)
