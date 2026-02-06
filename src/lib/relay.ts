import { TRelayInfo } from '@/types'

export function checkAlgoRelay(relayInfo: TRelayInfo | undefined) {
  return relayInfo?.software === 'https://github.com/bitvora/algo-relay' // hardcode for now
}

export function checkSearchRelay(relayInfo: TRelayInfo | undefined) {
  return relayInfo?.supported_nips?.includes(50)
}
