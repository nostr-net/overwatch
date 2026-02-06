/**
 * ScreenSizeProvider (Jotai-based)
 *
 * This is a bridge provider that uses Jotai atoms internally
 * but maintains the same Context API interface for backward compatibility.
 *
 * Eventually, consumers should migrate to using the Jotai hooks directly
 * and this provider can be removed.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { isSmallScreenAtom, isLargeScreenAtom } from '@/store/atoms/user'

type TScreenSizeContext = {
  isSmallScreen: boolean
  isLargeScreen: boolean
}

const ScreenSizeContext = createContext<TScreenSizeContext | undefined>(undefined)

export const useScreenSize = () => {
  const context = useContext(ScreenSizeContext)
  if (!context) {
    throw new Error('useScreenSize must be used within a ScreenSizeProvider')
  }
  return context
}

export function ScreenSizeProvider({ children }: { children: React.ReactNode }) {
  // Use Jotai atoms for state
  const initialSmallScreen = useAtomValue(isSmallScreenAtom)
  const initialLargeScreen = useAtomValue(isLargeScreenAtom)

  // Keep state for re-renders on window resize
  const [isSmallScreen, setIsSmallScreen] = useState(initialSmallScreen)
  const [isLargeScreen, setIsLargeScreen] = useState(initialLargeScreen)

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768)
      setIsLargeScreen(window.innerWidth >= 1280)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ScreenSizeContext.Provider
      value={{
        isSmallScreen,
        isLargeScreen
      }}
    >
      {children}
    </ScreenSizeContext.Provider>
  )
}
