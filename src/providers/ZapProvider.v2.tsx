/**
 * ZapProvider v2 - Jotai-based Bridge Provider
 *
 * Backward compatible Context API provider using Jotai atoms
 */

import { createContext, useContext, useEffect } from 'react'
import { onConnected, onDisconnected } from '@getalby/bitcoin-connect-react'
import lightningService from '@/services/lightning.service'
import { useZap as useZapStore } from '@/store/hooks/useZap'

type TZapContext = {
  isWalletConnected: boolean
  provider: any
  walletInfo: any
  defaultZapSats: number
  updateDefaultSats: (sats: number) => void
  defaultZapComment: string
  updateDefaultComment: (comment: string) => void
  quickZap: boolean
  updateQuickZap: (quickZap: boolean) => void
}

const ZapContext = createContext<TZapContext | undefined>(undefined)

export const useZap = () => {
  const context = useContext(ZapContext)
  if (!context) {
    throw new Error('useZap must be used within a ZapProvider')
  }
  return context
}

export function ZapProvider({ children }: { children: React.ReactNode }) {
  const store = useZapStore()

  useEffect(() => {
    const unSubOnConnected = onConnected((provider) => {
      store.setIsWalletConnected(true)
      store.setWalletInfo(null)
      store.setProvider(provider)
      lightningService.provider = provider
      provider.getInfo().then(store.setWalletInfo)
    })
    const unSubOnDisconnected = onDisconnected(() => {
      store.setIsWalletConnected(false)
      store.setProvider(null)
      lightningService.provider = null
    })

    return () => {
      unSubOnConnected()
      unSubOnDisconnected()
    }
  }, [])

  return (
    <ZapContext.Provider
      value={{
        isWalletConnected: store.isWalletConnected,
        provider: store.provider,
        walletInfo: store.walletInfo,
        defaultZapSats: store.defaultZapSats,
        updateDefaultSats: store.updateDefaultSats,
        defaultZapComment: store.defaultZapComment,
        updateDefaultComment: store.updateDefaultComment,
        quickZap: store.quickZap,
        updateQuickZap: store.updateQuickZap
      }}
    >
      {children}
    </ZapContext.Provider>
  )
}
