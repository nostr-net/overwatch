/**
 * Screen Size Hook (Jotai-based)
 *
 * This hook provides access to screen size state using Jotai atoms.
 * It replaces the old ScreenSizeProvider Context API implementation.
 */

import { useAtomValue } from 'jotai'
import { isSmallScreenAtom, isLargeScreenAtom } from '../atoms/user'

export function useScreenSize() {
  const isSmallScreen = useAtomValue(isSmallScreenAtom)
  const isLargeScreen = useAtomValue(isLargeScreenAtom)

  return {
    isSmallScreen,
    isLargeScreen
  }
}
