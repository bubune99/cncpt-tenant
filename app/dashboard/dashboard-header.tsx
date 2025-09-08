import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe, LogOut } from "lucide-react"
import { logoutAction } from "@/app/auth-actions"
import type { User } from "@/lib/auth"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Globe className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">SubdomainPro</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="text-foreground font-medium">
              Dashboard
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Support
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
