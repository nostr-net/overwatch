/**
 * Theme Hook (Jotai-based)
 *
 * This hook provides access to theme state using Jotai atoms.
 * It replaces the old ThemeProvider Context API implementation.
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import storage from '@/services/local-storage.service'
import { TThemeSetting } from '@/types'
import { TPrimaryColor } from '@/constants'
import {
  themeSettingAtom,
  primaryColorAtom,
  currentThemeAtom,
  updateThemeCSSAtom
} from '../atoms/user'

export function useTheme() {
  const [themeSetting, setThemeSettingRaw] = useAtom(themeSettingAtom)
  const [primaryColor, setPrimaryColorRaw] = useAtom(primaryColorAtom)
  const currentTheme = useAtomValue(currentThemeAtom)
  const updateThemeCSS = useSetAtom(updateThemeCSSAtom)

  // Update CSS variables when theme or primary color changes
  useEffect(() => {
    updateThemeCSS()
  }, [currentTheme, primaryColor, updateThemeCSS])

  // Listen to system theme changes when in 'system' mode
  useEffect(() => {
    if (themeSetting !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      updateThemeCSS()
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [themeSetting, updateThemeCSS])

  // Wrapper functions that also update localStorage
  const setThemeSetting = (setting: TThemeSetting) => {
    setThemeSettingRaw(setting)
    storage.setThemeSetting(setting)
  }

  const setPrimaryColor = (color: TPrimaryColor) => {
    setPrimaryColorRaw(color)
    storage.setPrimaryColor(color)
  }

  return {
    themeSetting,
    setThemeSetting,
    primaryColor,
    setPrimaryColor
  }
}
