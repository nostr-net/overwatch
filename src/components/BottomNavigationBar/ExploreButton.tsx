import { usePrimaryPage } from '@/PageManager'
import { Compass } from 'lucide-react'
import BottomNavigationBarItem from './BottomNavigationBarItem'

export default function ExploreButton() {
  const { navigate, current, display } = usePrimaryPage()

  return (
    <BottomNavigationBarItem
      active={current === 'explore' && display}
      onClick={() => navigate('explore')}
    >
      <Compass />
    </BottomNavigationBarItem>
  )
}
