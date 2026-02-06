import { useRef } from 'react'
import equal from 'fast-deep-equal'

/**
 * A custom hook that returns a memoized value based on deep equality comparison.
 * This is useful for preventing unnecessary re-renders when using objects or arrays
 * in dependency arrays, replacing the problematic JSON.stringify pattern.
 *
 * @param value - The value to memoize
 * @returns A stable reference to the value that only changes when deep equality fails
 *
 * @example
 * ```tsx
 * const subRequests = [{ kinds: [1], limit: 100 }]
 * const memoizedRequests = useDeepCompareMemo(subRequests)
 *
 * useEffect(() => {
 *   // This effect only runs when subRequests deeply changes
 * }, [memoizedRequests])
 * ```
 */
export function useDeepCompareMemo<T>(value: T): T {
  const ref = useRef<T>(value)

  if (!equal(ref.current, value)) {
    ref.current = value
  }

  return ref.current
}
