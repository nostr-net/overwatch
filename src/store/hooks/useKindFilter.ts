/**
 * Kind Filter Hook
 *
 * Event kind filtering configuration
 */

import { useAtom } from 'jotai'
import { showKindsAtom } from '../atoms/filter'
import storage from '@/services/local-storage.service'

export function useKindFilter() {
  const [showKinds, setShowKinds] = useAtom(showKindsAtom)

  const updateShowKinds = (kinds: number[]) => {
    storage.setShowKinds(kinds)
    setShowKinds(kinds)
  }

  return {
    showKinds,
    updateShowKinds
  }
}
