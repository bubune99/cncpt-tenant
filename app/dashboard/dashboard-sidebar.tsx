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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/auth-actions"
import { useHelp } from "@/components/help-system"

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
    <div className="w-64 bg-gray-950 text-white flex flex-col h-screen sticky top-0">
      {/* Subdomain Selector */}
      <div className="p-4 border-b border-gray-800" data-help-key="dashboard.sidebar.sites">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between mb-3 h-auto p-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center font-semibold text-sm">
                  {selectedSubdomain?.[0]?.toUpperCase() || "S"}
                </div>
                <span className="font-medium">{selectedSubdomain || "Select Site"}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {subdomains.map((subdomain) => (
              <DropdownMenuItem
                key={subdomain.subdomain}
                onClick={() => setSelectedSubdomain(subdomain.subdomain)}
                className={cn("flex items-center space-x-2", selectedSubdomain === subdomain.subdomain && "bg-accent")}
              >
                <div className="w-6 h-6 bg-gray-200 text-gray-800 rounded flex items-center justify-center font-semibold text-xs">
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
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{section.title}</h3>
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
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
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

      {/* Help Button */}
      <div className="px-4 py-2 border-t border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleHelpMode}
          data-help-key="dashboard.header.help"
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white",
            helpMode.isActive && "bg-[#C26A3A] text-white hover:bg-[#A85830]"
          )}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          {helpMode.isActive ? "Exit Help Mode" : "Help Mode"}
          <kbd className="ml-auto text-xs bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+Q</kbd>
        </Button>
      </div>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-3" data-help-key="dashboard.header.user">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start text-gray-300 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}
