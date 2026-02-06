/**
 * KindFilterProvider v2 - Jotai-based Bridge Provider
 *
 * Backward compatible Context API provider using Jotai atoms
 */

import { createContext, useContext } from 'react'
import { useKindFilter as useKindFilterStore } from '@/store/hooks/useKindFilter'

type TKindFilterContext = {
  showKinds: number[]
  updateShowKinds: (kinds: number[]) => void
}

const KindFilterContext = createContext<TKindFilterContext | undefined>(undefined)

export const useKindFilter = () => {
  const context = useContext(KindFilterContext)
  if (!context) {
    throw new Error('useKindFilter must be used within a KindFilterProvider')
  }
  return context
}

export function KindFilterProvider({ children }: { children: React.ReactNode }) {
  const store = useKindFilterStore()

  return (
    <KindFilterContext.Provider value={{ showKinds: store.showKinds, updateShowKinds: store.updateShowKinds }}>
      {children}
    </KindFilterContext.Provider>
  )
}
