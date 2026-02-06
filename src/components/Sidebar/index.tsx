import ChannelList from '@/components/ChannelList'
import RelayIndicator from '@/components/RelayIndicator'
import { cn } from '@/lib/utils'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { useUserPreferences } from '@/providers/UserPreferencesProvider'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import AccountButton from './AccountButton'
import LayoutSwitcher from './LayoutSwitcher'

export default function PrimaryPageSidebar() {
  const { isSmallScreen } = useScreenSize()
  const { themeSetting } = useTheme()
  const { sidebarCollapse, updateSidebarCollapse, enableSingleColumnLayout } = useUserPreferences()

  if (isSmallScreen) return null

  return (
    <div
      className={cn(
        'relative flex flex-col pb-2 pt-3 h-full shrink-0',
        sidebarCollapse ? 'px-2 w-16' : 'px-4 w-52'
      )}
    >
      {/* Channel List (scrollable) */}
      <ChannelList collapse={sidebarCollapse} className="flex-1 overflow-y-auto mb-3" />

      {/* Bottom section: Relay Indicator, Account & Layout Switcher */}
      <div className="space-y-4 pt-2 border-t border-border">
        <RelayIndicator collapse={sidebarCollapse} />
        <LayoutSwitcher collapse={sidebarCollapse} />
        <AccountButton collapse={sidebarCollapse} />
      </div>

      {/* Collapse toggle button */}
      <button
        className={cn(
          'absolute flex flex-col justify-center items-center right-0 w-5 h-6 p-0 rounded-l-md hover:shadow-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors [&_svg]:size-4',
          themeSetting === 'pure-black' || enableSingleColumnLayout ? 'top-3' : 'top-5'
        )}
        onClick={(e) => {
          e.stopPropagation()
          updateSidebarCollapse(!sidebarCollapse)
        }}
        aria-label={sidebarCollapse ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapse ? <ChevronsRight /> : <ChevronsLeft />}
      </button>
    </div>
  )
}
