import { usePrimaryPage } from '@/PageManager'
import { useChannel } from '@/providers/ChannelProvider'
import { Hash } from 'lucide-react'
import BottomNavigationBarItem from './BottomNavigationBarItem'

export default function HomeButton() {
  const { navigate, current, display } = usePrimaryPage()
  const { clearActiveChannel, activeChannel } = useChannel()

  const handleClick = () => {
    clearActiveChannel()
    navigate('home')
  }

  return (
    <BottomNavigationBarItem
      active={current === 'home' && display && !activeChannel}
      onClick={handleClick}
    >
      <Hash />
    </BottomNavigationBarItem>
  )
}
