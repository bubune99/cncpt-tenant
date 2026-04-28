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
  Link as LinkIcon,
  Palette,
  ChevronDown,
  User,
  CreditCard,
  Plus,
  Server,
  Eye,
  Building2,
  Bot,
  MessageSquare,
  Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDemoToast } from "./demo-toast"
import type { DemoSubdomain } from "@/lib/demo-dashboard-mock"

interface DemoSidebarProps {
  subdomains: ReadonlyArray<DemoSubdomain>
  activeSection: string
  onSectionChange: (section: string) => void
  selectedSubdomain: string
  onSubdomainChange: (subdomain: string) => void
  user: { name: string; email: string }
}

/**
 * Static sidebar for the public demo dashboard.
 * Mirrors the real DashboardSidebar layout but every action is a no-op
 * that fires a toast saying "this is a demo".
 */
export function DemoSidebar({
  subdomains,
  activeSection,
  onSectionChange,
  selectedSubdomain,
  onSubdomainChange,
  user,
}: DemoSidebarProps) {
  const { showDemoToast } = useDemoToast()

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
        { id: "visibility", label: "Site Visibility", icon: Eye },
        { id: "domains", label: "Custom Domains", icon: LinkIcon },
        { id: "branding", label: "Branding", icon: Palette },
        { id: "settings", label: "Site Settings", icon: Settings },
        { id: "frontend", label: "Hosting", icon: Server },
      ],
    },
    {
      title: "Integrations",
      items: [{ id: "mcp", label: "MCP / AI Agents", icon: Bot }],
    },
    {
      title: "Collaboration",
      items: [{ id: "teams", label: "Teams", icon: Building2 }],
    },
    {
      title: "Support",
      items: [{ id: "support", label: "Support Tickets", icon: MessageSquare }],
    },
    {
      title: "Account",
      items: [
        { id: "credits", label: "AI Credits", icon: Coins },
        { id: "billing", label: "Billing", icon: CreditCard },
      ],
    },
  ]

  const selected = subdomains.find((s) => s.subdomain === selectedSubdomain)

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Subdomain selector */}
      <div className="p-4 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between mb-3 h-auto p-2 hover:bg-sidebar-accent"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center font-semibold text-sm">
                  {selected?.subdomain[0]?.toUpperCase() ?? "S"}
                </div>
                <span className="font-medium truncate">
                  {selected?.subdomain ?? "Select Site"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {subdomains.map((s) => (
              <DropdownMenuItem
                key={s.subdomain}
                onClick={() => onSubdomainChange(s.subdomain)}
                className={cn(
                  "flex items-center space-x-2",
                  selectedSubdomain === s.subdomain && "bg-accent",
                )}
              >
                <div className="w-6 h-6 bg-muted text-muted-foreground rounded flex items-center justify-center font-semibold text-xs">
                  {s.subdomain[0]?.toUpperCase()}
                </div>
                <span>{s.subdomain}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                showDemoToast(
                  "Sign up to create your own subdomain — it's free to start.",
                )
              }
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => onSectionChange(item.id)}
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

      {/* User block */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
