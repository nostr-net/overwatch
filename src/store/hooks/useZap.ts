/**
 * Zap Hook
 *
 * Lightning wallet and zap configuration management
 */

import { useAtom } from 'jotai'
import {
  isWalletConnectedAtom,
  walletProviderAtom,
  walletInfoAtom,
  defaultZapSatsAtom,
  defaultZapCommentAtom,
  quickZapAtom
} from '../atoms/zap'
import storage from '@/services/local-storage.service'

export function useZap() {
  const [isWalletConnected, setIsWalletConnected] = useAtom(isWalletConnectedAtom)
  const [provider, setProvider] = useAtom(walletProviderAtom)
  const [walletInfo, setWalletInfo] = useAtom(walletInfoAtom)
  const [defaultZapSats, setDefaultZapSats] = useAtom(defaultZapSatsAtom)
  const [defaultZapComment, setDefaultZapComment] = useAtom(defaultZapCommentAtom)
  const [quickZap, setQuickZap] = useAtom(quickZapAtom)

  const updateDefaultSats = (sats: number) => {
    storage.setDefaultZapSats(sats)
    setDefaultZapSats(sats)
  }

  const updateDefaultComment = (comment: string) => {
    storage.setDefaultZapComment(comment)
    setDefaultZapComment(comment)
  }

  const updateQuickZap = (quickZap: boolean) => {
    storage.setQuickZap(quickZap)
    setQuickZap(quickZap)
  }

  return {
    isWalletConnected,
    provider,
    walletInfo,
    defaultZapSats,
    defaultZapComment,
    quickZap,
    updateDefaultSats,
    updateDefaultComment,
    updateQuickZap,
    // Internal setters
    setIsWalletConnected,
    setProvider,
    setWalletInfo
  }
}
