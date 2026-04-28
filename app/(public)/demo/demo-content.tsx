"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  PenSquare,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react"
import { useDemoToast } from "./demo-toast"
import {
  DEMO_METRICS,
  DEMO_RECENT_ACTIVITY,
  DEMO_TRAFFIC_SOURCES,
  DEMO_VISITS_BARS,
  type DemoSubdomain,
} from "@/lib/demo-dashboard-mock"

interface DemoContentProps {
  user: { name: string }
  subdomains: ReadonlyArray<DemoSubdomain>
  activeSection: string
  selectedSubdomain: string
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US").format(n)

function MetricCard({
  label,
  value,
  changePct,
  icon: Icon,
}: {
  label: string
  value: string
  changePct: number
  icon: React.ComponentType<{ className?: string }>
}) {
  const positive = changePct >= 0
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div
          className={`text-xs flex items-center gap-1 ${
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          <span>
            {positive ? "+" : ""}
            {changePct}% vs last month
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function VisitsChart() {
  const max = Math.max(...DEMO_VISITS_BARS)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visits over time</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </div>
          <Badge variant="secondary">All sites</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-40">
          {DEMO_VISITS_BARS.map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-orange-400 rounded-sm transition-all"
                style={{ height: `${(value / max) * 100}%` }}
                title={`${months[i]}: ${formatNumber(value)} visits`}
              />
              <span className="text-[10px] text-muted-foreground">
                {months[i]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TrafficSources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic sources</CardTitle>
        <CardDescription>This month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {DEMO_TRAFFIC_SOURCES.map((source) => (
          <div key={source.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{source.label}</span>
              <span className="text-muted-foreground">{source.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-orange-400 rounded-full"
                style={{ width: `${source.pct}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest events across all sites</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {DEMO_RECENT_ACTIVITY.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{event.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.timeAgo}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function SubdomainCard({ subdomain }: { subdomain: DemoSubdomain }) {
  const { showDemoToast } = useDemoToast()
  const createdDate = new Date(subdomain.created_at).toLocaleDateString()
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 text-white flex items-center justify-center font-semibold text-lg shrink-0">
              {subdomain.subdomain[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {subdomain.site_title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {subdomain.subdomain}.cncptweb.com
              </p>
              <p className="text-xs text-muted-foreground">
                Created on {createdDate} ·{" "}
                {formatNumber(subdomain.visitsThisMonth)} visits this month
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {subdomain.status}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                showDemoToast(
                  "Sign up to visit and customize your real site.",
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() =>
                showDemoToast(
                  "Sign up to manage real content with the page builder.",
                )
              }
            >
              <PenSquare className="h-4 w-4 mr-2" />
              Manage Content
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => showDemoToast()}
              className="text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewSection({
  user,
  subdomains,
}: {
  user: { name: string }
  subdomains: ReadonlyArray<DemoSubdomain>
}) {
  const { showDemoToast } = useDemoToast()
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.name}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening across your sites today.
          </p>
        </div>
        <Button
          onClick={() =>
            showDemoToast(
              "Sign up to create your own subdomain — it's free to start.",
            )
          }
          className="hidden sm:inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Subdomain
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue (30d)"
          value={formatCurrency(DEMO_METRICS.revenue)}
          changePct={DEMO_METRICS.revenueChange}
          icon={ShoppingCart}
        />
        <MetricCard
          label="Orders"
          value={formatNumber(DEMO_METRICS.orders)}
          changePct={DEMO_METRICS.ordersChange}
          icon={ShoppingCart}
        />
        <MetricCard
          label="Customers"
          value={formatNumber(DEMO_METRICS.customers)}
          changePct={DEMO_METRICS.customersChange}
          icon={Users}
        />
        <MetricCard
          label="Conversion"
          value={`${DEMO_METRICS.conversionRate}%`}
          changePct={DEMO_METRICS.conversionRateChange}
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VisitsChart />
        </div>
        <TrafficSources />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your sites</CardTitle>
          <CardDescription>
            Manage and monitor all your active subdomains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subdomains.map((s) => (
            <SubdomainCard key={s.id} subdomain={s} />
          ))}
        </CardContent>
      </Card>

      <RecentActivity />
    </div>
  )
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">
          A preview of the {title.toLowerCase()} section.
        </p>
      </div>
      <Card>
        <CardContent className="py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Available with a free account
            </h2>
            <p className="text-muted-foreground mb-6">
              Sign up to unlock the full {title.toLowerCase()} workflow with
              your own data.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Sign up free
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const SECTION_TITLES: Record<string, string> = {
  analytics: "Analytics",
  visibility: "Site Visibility",
  domains: "Custom Domains",
  branding: "Branding",
  settings: "Site Settings",
  frontend: "Hosting",
  mcp: "MCP / AI Agents",
  teams: "Teams",
  support: "Support Tickets",
  credits: "AI Credits",
  billing: "Billing",
}

export function DemoContent({
  user,
  subdomains,
  activeSection,
  selectedSubdomain,
}: DemoContentProps) {
  // selectedSubdomain is reserved for future per-site views; the overview
  // already shows all sites, so we simply ignore it for now.
  void selectedSubdomain

  const renderContent = () => {
    if (activeSection === "overview") {
      return <OverviewSection user={user} subdomains={subdomains} />
    }
    const title = SECTION_TITLES[activeSection] ?? "Coming soon"
    return <PlaceholderSection title={title} />
  }

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-6 py-8">{renderContent()}</main>
    </div>
  )
}
