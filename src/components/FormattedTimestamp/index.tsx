import dayjs from 'dayjs'

export function FormattedTimestamp({
  timestamp,
  short = false,
  className
}: {
  timestamp: number
  short?: boolean
  className?: string
}) {
  return (
    <span className={className}>
      <FormattedTimestampContent timestamp={timestamp} short={short} />
    </span>
  )
}

function FormattedTimestampContent({
  timestamp,
  short = false
}: {
  timestamp: number
  short?: boolean
}) {
  const time = dayjs(timestamp * 1000)
  const now = dayjs()
  const isToday = time.isSame(now, 'day')
  const isSameYear = time.isSame(now, 'year')

  if (isToday) {
    return time.format('HH:mm')
  }

  if (short) {
    return time.format('M/D HH:mm')
  }

  if (isSameYear) {
    return time.format('MMM D, HH:mm')
  }

  return time.format('MMM D YYYY, HH:mm')
}
