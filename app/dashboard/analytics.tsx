"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Eye, TrendingUp, Globe } from "lucide-react"

interface AnalyticsProps {
  subdomains: any[]
}

export function Analytics({ subdomains }: AnalyticsProps) {
  const stats = [
    { label: "Total Visitors", value: "1,234", change: "+12%", icon: Users },
    { label: "Page Views", value: "5,678", change: "+8%", icon: Eye },
    { label: "Active Sites", value: subdomains.length.toString(), change: "0%", icon: Globe },
    { label: "Conversion Rate", value: "3.2%", change: "+0.5%", icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your site performance and visitor insights</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-center">
                  <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="text-xs">
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Traffic Overview</span>
          </CardTitle>
          <CardDescription>Visitor traffic for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Analytics charts coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { page: "/", views: "1,234", percentage: "45%" },
                { page: "/about", views: "567", percentage: "20%" },
                { page: "/contact", views: "234", percentage: "8%" },
              ].map((item) => (
                <div key={item.page} className="flex items-center justify-between">
                  <span className="font-medium">{item.page}</span>
                  <div className="text-right">
                    <p className="font-medium">{item.views}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: "Direct", visitors: "567", percentage: "42%" },
                { source: "Google", visitors: "234", percentage: "18%" },
                { source: "Social Media", visitors: "123", percentage: "9%" },
              ].map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <span className="font-medium">{item.source}</span>
                  <div className="text-right">
                    <p className="font-medium">{item.visitors}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
