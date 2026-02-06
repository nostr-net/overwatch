/**
 * ThemeProvider (Jotai-based)
 *
 * This is a bridge provider that uses Jotai atoms internally
 * but maintains the same Context API interface for backward compatibility.
 *
 * Eventually, consumers should migrate to using the Jotai hooks directly
 * and this provider can be removed.
 */

import { createContext, useContext } from 'react'
import { useTheme as useJotaiTheme } from '@/store/hooks/useTheme'
import { TThemeSetting } from '@/types'
import { TPrimaryColor } from '@/constants'

type ThemeProviderState = {
  themeSetting: TThemeSetting
  setThemeSetting: (themeSetting: TThemeSetting) => void
  primaryColor: TPrimaryColor
  setPrimaryColor: (color: TPrimaryColor) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai-based hook internally
  const theme = useJotaiTheme()

  return (
    <ThemeProviderContext.Provider value={theme}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
