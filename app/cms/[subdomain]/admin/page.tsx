"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@cncpt/cms/ui"
import { useAuth, useCMSConfig } from "@cncpt/cms/hooks"
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

export default function CMSDashboardPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const { user } = useAuth()
  const { config } = useCMSConfig()

  // Mock data - will be replaced with real API calls scoped to subdomain
  const stats = [
    {
      title: "Total Revenue",
      value: "$12,345",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      description: "vs last month",
    },
    {
      title: "Orders",
      value: "156",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      description: "vs last month",
    },
    {
      title: "Products",
      value: "48",
      change: "+3",
      trend: "up",
      icon: Package,
      description: "active products",
    },
    {
      title: "Customers",
      value: "1,234",
      change: "+15.3%",
      trend: "up",
      icon: Users,
      description: "vs last month",
    },
  ]

  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", amount: "$125.00", status: "Completed" },
    { id: "ORD-002", customer: "Jane Smith", amount: "$89.99", status: "Processing" },
    { id: "ORD-003", customer: "Bob Wilson", amount: "$245.00", status: "Pending" },
    { id: "ORD-004", customer: "Alice Brown", amount: "$67.50", status: "Completed" },
  ]

  const topProducts = [
    { name: "Product A", sales: 45, revenue: "$2,250" },
    { name: "Product B", sales: 38, revenue: "$1,900" },
    { name: "Product C", sales: 32, revenue: "$1,600" },
    { name: "Product D", sales: 28, revenue: "$1,400" },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with{" "}
          <strong>{config.siteName || subdomain}</strong> today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight
          const trendColor = stat.trend === "up" ? "text-green-600" : "text-red-600"

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={`flex items-center ${trendColor}`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {stat.change}
                  </span>
                  <span className="ml-1">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <p className={`text-xs ${
                      order.status === "Completed" ? "text-green-600" :
                      order.status === "Processing" ? "text-blue-600" :
                      "text-yellow-600"
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-4">
                      #{index + 1}
                    </span>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.revenue}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sales} sales
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,521</div>
            <p className="text-xs text-muted-foreground">+20.1% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$79.12</div>
            <p className="text-xs text-muted-foreground">+$4.50 from last week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
