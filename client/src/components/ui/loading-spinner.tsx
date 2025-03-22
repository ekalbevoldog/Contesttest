
import { cn } from "@/lib/utils"

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("animate-spin rounded-full h-6 w-6 border-b-2 border-primary", className)} />
  )
}
