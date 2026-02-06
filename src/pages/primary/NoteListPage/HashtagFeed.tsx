import NormalFeed from '@/components/NormalFeed'
import { BIG_RELAY_URLS } from '@/constants'
import { useFeed } from '@/providers/FeedProvider'

export default function HashtagFeed() {
  const { feedInfo } = useFeed()

  if (feedInfo.feedType !== 'hashtag' || !feedInfo.hashtag) {
    return null
  }

  return (
    <NormalFeed
      subRequests={[
        {
          urls: BIG_RELAY_URLS,
          filter: { '#t': [feedInfo.hashtag] }
        }
      ]}
      areAlgoRelays={false}
      isMainFeed
      showRelayCloseReason
    />
  )
}
