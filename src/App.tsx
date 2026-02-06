import 'yet-another-react-lightbox/styles.css'
import './index.css'

import { Provider as JotaiProvider } from 'jotai'
import { Toaster } from '@/components/ui/sonner'
// ALL PROVIDERS NOW USE JOTAI v2 - Sprint 3 Complete! 🎉
import { BookmarksProvider } from '@/providers/BookmarksProvider.v2'
import { ChannelProvider } from '@/providers/ChannelProvider'
import { ContentPolicyProvider } from '@/providers/ContentPolicyProvider.v2'
import { DeletedEventProvider } from '@/providers/DeletedEventProvider.v2'
import { FavoriteRelaysProvider } from '@/providers/FavoriteRelaysProvider.v2'
import { FeedProvider } from '@/providers/FeedProvider.v2'
import { FollowListProvider } from '@/providers/FollowListProvider.v2'
import { KindFilterProvider } from '@/providers/KindFilterProvider.v2'
import { MediaUploadServiceProvider } from '@/providers/MediaUploadServiceProvider.v2'
import { MuteListProvider } from '@/providers/MuteListProvider.v2'
import { NostrProvider } from '@/providers/NostrProvider.v2'
import { PinListProvider } from '@/providers/PinListProvider.v2'
import { ReplyProvider } from '@/providers/ReplyProvider.v2'
import { ScreenSizeProvider } from '@/providers/ScreenSizeProvider.v2'
import { ThemeProvider } from '@/providers/ThemeProvider.v2'
import { UserPreferencesProvider } from '@/providers/UserPreferencesProvider.v2'
import { TranslationServiceProvider } from '@/providers/TranslationServiceProvider.v2'
import { UserTrustProvider } from '@/providers/UserTrustProvider.v2'
import { ZapProvider } from '@/providers/ZapProvider.v2'
import { PageManager } from './PageManager'

export default function App(): JSX.Element {
  return (
    <JotaiProvider>
      <ScreenSizeProvider>
        <UserPreferencesProvider>
          <ThemeProvider>
            <ContentPolicyProvider>
              <DeletedEventProvider>
                <NostrProvider>
                  <ZapProvider>
                    <TranslationServiceProvider>
                      <FavoriteRelaysProvider>
                        <FollowListProvider>
                          <MuteListProvider>
                            <UserTrustProvider>
                              <BookmarksProvider>
                                <PinListProvider>
                                  <ChannelProvider>
                                    <FeedProvider>
                                      <ReplyProvider>
                                        <MediaUploadServiceProvider>
                                          <KindFilterProvider>
                                            <PageManager />
                                            <Toaster />
                                          </KindFilterProvider>
                                        </MediaUploadServiceProvider>
                                      </ReplyProvider>
                                    </FeedProvider>
                                  </ChannelProvider>
                                </PinListProvider>
                              </BookmarksProvider>
                            </UserTrustProvider>
                          </MuteListProvider>
                        </FollowListProvider>
                      </FavoriteRelaysProvider>
                    </TranslationServiceProvider>
                  </ZapProvider>
                </NostrProvider>
              </DeletedEventProvider>
            </ContentPolicyProvider>
          </ThemeProvider>
        </UserPreferencesProvider>
      </ScreenSizeProvider>
    </JotaiProvider>
  )
}
