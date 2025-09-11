"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  Settings,
  BarChart3,
  Code,
  Link,
  Shield,
  Palette,
  ChevronDown,
  User,
  LogOut,
  CreditCard,
  Github,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  user: any
  subdomains: any[]
  activeSection: string
  setActiveSection: (section: string) => void
  selectedSubdomain: string | null
  setSelectedSubdomain: (subdomain: string | null) => void
  isDeveloperMode: boolean
  setIsDeveloperMode: (mode: boolean) => void
}

export function DashboardSidebar({
  user,
  subdomains,
  activeSection,
  setActiveSection,
  selectedSubdomain,
  setSelectedSubdomain,
  isDeveloperMode,
  setIsDeveloperMode,
}: DashboardSidebarProps) {
  const menuSections = [
    {
      title: "Dashboard",
      items: [
        { id: "overview", label: "Overview", icon: Globe },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Site Management",
      items: [
        { id: "domains", label: "Custom Domains", icon: Link },
        { id: "repositories", label: "GitHub Integration", icon: Github },
        { id: "settings", label: "Site Settings", icon: Settings },
        { id: "appearance", label: "Appearance", icon: Palette },
      ],
    },
    {
      title: "Billing",
      items: [{ id: "billing", label: "Subscription & Billing", icon: CreditCard }],
    },
    {
      title: "Advanced",
      items: [
        { id: "security", label: "Security", icon: Shield },
        ...(isDeveloperMode ? [{ id: "developer", label: "Developer Tools", icon: Code }] : []),
      ],
    },
  ]

  const handleSectionClick = (sectionId: string) => {
    console.log("[v0] Sidebar button clicked:", sectionId)
    setActiveSection(sectionId)
  }

  const handleSignOut = async () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/"
    } catch (error) {
      console.error("[v0] Sign out error:", error)
      window.location.href = "/"
    }
  }

  return (
    <div className="w-64 bg-gray-950 text-white flex flex-col">
      {/* Subdomain Selector */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center font-semibold text-sm">
              {selectedSubdomain?.[0]?.toUpperCase() || "S"}
            </div>
            <span className="font-medium">{selectedSubdomain || "Select Site"}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        {/* Developer Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Developer Mode</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeveloperMode(!isDeveloperMode)}
            className={cn("h-6 px-2 text-xs", isDeveloperMode ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300")}
          >
            {isDeveloperMode ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleSectionClick(item.id)}
                    className={cn(
                      "w-full justify-start space-x-3 px-3 py-2 h-auto text-sm font-medium transition-colors",
                      activeSection === item.id
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.id === "developer" && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Beta
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:text-white"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
