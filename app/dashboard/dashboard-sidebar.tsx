"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Globe,
  Settings,
  BarChart3,
  Link,
  Palette,
  ChevronDown,
  User,
  LogOut,
  CreditCard,
  Plus,
  Server,
  Shield,
  Eye,
  HelpCircle,
  Building2,
  Bot,
  Moon,
  Sun,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/auth-actions"
import { useHelp } from "@/components/help-system"
import { useTheme } from "next-themes"

interface DashboardSidebarProps {
  user: any
  subdomains: any[]
  activeSection: string
  setActiveSection: (section: string) => void
  selectedSubdomain: string | null
  setSelectedSubdomain: (subdomain: string | null) => void
}

export function DashboardSidebar({
  user,
  subdomains,
  activeSection,
  setActiveSection,
  selectedSubdomain,
  setSelectedSubdomain,
}: DashboardSidebarProps) {
  const router = useRouter()
  const { helpMode, toggleHelpMode } = useHelp()
  const { setTheme, theme } = useTheme()

  const menuSections = [
    {
      title: "Dashboard",
      items: [
        { id: "overview", label: "Overview", icon: Globe, helpKey: "dashboard.sidebar.overview" },
        { id: "analytics", label: "Analytics", icon: BarChart3, helpKey: "dashboard.sidebar.analytics" },
      ],
    },
    {
      title: "Site Management",
      items: [
        { id: "visibility", label: "Site Visibility", icon: Eye, helpKey: "dashboard.sidebar.visibility" },
        { id: "domains", label: "Custom Domains", icon: Link, helpKey: "dashboard.sidebar.domains" },
        { id: "settings", label: "Site Settings", icon: Settings, helpKey: "dashboard.sidebar.settings" },
        { id: "appearance", label: "Appearance", icon: Palette, helpKey: "dashboard.sidebar.appearance" },
        { id: "frontend", label: "Hosting", icon: Server, helpKey: "dashboard.sidebar.frontend" },
        { id: "security", label: "Security", icon: Shield, helpKey: "dashboard.sidebar.security" },
      ],
    },
    {
      title: "Integrations",
      items: [
        { id: "mcp", label: "MCP / AI Agents", icon: Bot, helpKey: "dashboard.sidebar.mcp" },
      ],
    },
    {
      title: "Collaboration",
      items: [
        { id: "teams", label: "Teams", icon: Building2, helpKey: "dashboard.sidebar.teams", isRoute: true, route: "/dashboard/teams" },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "support", label: "Support Tickets", icon: MessageSquare, helpKey: "dashboard.sidebar.support", isRoute: true, route: "/dashboard/support" },
      ],
    },
    {
      title: "Account",
      items: [
        { id: "billing", label: "Billing", icon: CreditCard, helpKey: "dashboard.sidebar.billing" },
      ],
    },
  ]

  const handleSectionClick = (sectionId: string, route?: string) => {
    console.log("[v0] Sidebar button clicked:", sectionId)
    if (route) {
      router.push(route)
    } else {
      setActiveSection(sectionId)
    }
  }

  const handleCreateNew = () => {
    router.push("/dashboard/create-subdomain")
  }

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Subdomain Selector */}
      <div className="p-4 border-b border-sidebar-border" data-help-key="dashboard.sidebar.sites">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between mb-3 h-auto p-2 hover:bg-sidebar-accent">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center font-semibold text-sm">
                  {selectedSubdomain?.[0]?.toUpperCase() || "S"}
                </div>
                <span className="font-medium">{selectedSubdomain || "Select Site"}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {subdomains.map((subdomain) => (
              <DropdownMenuItem
                key={subdomain.subdomain}
                onClick={() => setSelectedSubdomain(subdomain.subdomain)}
                className={cn("flex items-center space-x-2", selectedSubdomain === subdomain.subdomain && "bg-accent")}
              >
                <div className="w-6 h-6 bg-muted text-muted-foreground rounded flex items-center justify-center font-semibold text-xs">
                  {subdomain.subdomain[0]?.toUpperCase()}
                </div>
                <span>{subdomain.subdomain}</span>
              </DropdownMenuItem>
            ))}
            {subdomains.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={handleCreateNew} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const itemWithRoute = item as typeof item & { isRoute?: boolean; route?: string }
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleSectionClick(item.id, itemWithRoute.route)}
                    data-help-key={item.helpKey}
                    className={cn(
                      "w-full justify-start space-x-3 px-3 py-2 h-auto text-sm font-medium transition-colors",
                      activeSection === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 py-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          data-help-key="dashboard.header.theme"
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Sun className="w-4 h-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 ml-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="ml-6">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
      </div>

      {/* Help Button */}
      <div className="px-4 py-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleHelpMode}
          data-help-key="dashboard.header.help"
          className={cn(
            "w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            helpMode.isActive && "bg-accent text-accent-foreground hover:bg-accent/90"
          )}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          {helpMode.isActive ? "Exit Help Mode" : "Help Mode"}
          <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+Q</kbd>
        </Button>
      </div>

      {/* User Menu */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-3" data-help-key="dashboard.header.user">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/support")}
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent mb-1"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}
