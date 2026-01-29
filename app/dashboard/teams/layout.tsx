import { Suspense } from "react"
import { TeamsShell } from "./teams-shell"
import { Loader2 } from "lucide-react"

function TeamsLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading teams...</p>
      </div>
    </div>
  )
}

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<TeamsLoadingFallback />}>
      <TeamsShell>{children}</TeamsShell>
    </Suspense>
  )
}
