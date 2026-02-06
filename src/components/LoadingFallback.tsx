import { Loader2 } from 'lucide-react'

/**
 * Loading fallback component for lazy-loaded routes
 * Displays a centered spinner while the route component is being loaded
 */
export default function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Minimal loading fallback for faster rendering
 * Use this for secondary routes that load quickly
 */
export function MinimalLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}
