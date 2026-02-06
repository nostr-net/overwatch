import { match } from 'path-to-regexp'
import { lazy } from 'react'

// Lazy load all secondary pages for better code splitting
const AppearanceSettingsPage = lazy(() => import('./pages/secondary/AppearanceSettingsPage'))
const BookmarkPage = lazy(() => import('./pages/secondary/BookmarkPage'))
const FollowingListPage = lazy(() => import('./pages/secondary/FollowingListPage'))
const GeneralSettingsPage = lazy(() => import('./pages/secondary/GeneralSettingsPage'))
const MuteListPage = lazy(() => import('./pages/secondary/MuteListPage'))
const NoteListPage = lazy(() => import('./pages/secondary/NoteListPage'))
const NotePage = lazy(() => import('./pages/secondary/NotePage'))
const OthersRelaySettingsPage = lazy(() => import('./pages/secondary/OthersRelaySettingsPage'))
const PostSettingsPage = lazy(() => import('./pages/secondary/PostSettingsPage'))
const ProfileEditorPage = lazy(() => import('./pages/secondary/ProfileEditorPage'))
const ProfileListPage = lazy(() => import('./pages/secondary/ProfileListPage'))
const ProfilePage = lazy(() => import('./pages/secondary/ProfilePage'))
const RelayPage = lazy(() => import('./pages/secondary/RelayPage'))
const RelayReviewsPage = lazy(() => import('./pages/secondary/RelayReviewsPage'))
const RelaySettingsPage = lazy(() => import('./pages/secondary/RelaySettingsPage'))
const RizfulPage = lazy(() => import('./pages/secondary/RizfulPage'))
const SearchPage = lazy(() => import('./pages/secondary/SearchPage'))
const SettingsPage = lazy(() => import('./pages/secondary/SettingsPage'))
const TranslationPage = lazy(() => import('./pages/secondary/TranslationPage'))
const WalletPage = lazy(() => import('./pages/secondary/WalletPage'))

const ROUTES = [
  { path: '/notes', Component: NoteListPage },
  { path: '/notes/:id', Component: NotePage },
  { path: '/users', Component: ProfileListPage },
  { path: '/users/:id', Component: ProfilePage },
  { path: '/users/:id/following', Component: FollowingListPage },
  { path: '/users/:id/relays', Component: OthersRelaySettingsPage },
  { path: '/relays/:url', Component: RelayPage },
  { path: '/relays/:url/reviews', Component: RelayReviewsPage },
  { path: '/search', Component: SearchPage },
  { path: '/settings', Component: SettingsPage },
  { path: '/settings/relays', Component: RelaySettingsPage },
  { path: '/settings/wallet', Component: WalletPage },
  { path: '/settings/posts', Component: PostSettingsPage },
  { path: '/settings/general', Component: GeneralSettingsPage },
  { path: '/settings/appearance', Component: AppearanceSettingsPage },
  { path: '/settings/translation', Component: TranslationPage },
  { path: '/profile-editor', Component: ProfileEditorPage },
  { path: '/mutes', Component: MuteListPage },
  { path: '/rizful', Component: RizfulPage },
  { path: '/bookmarks', Component: BookmarkPage }
]

export const routes = ROUTES.map(({ path, Component }) => ({
  path,
  Component,
  matcher: match(path)
}))
