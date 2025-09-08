"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Download, Calendar, CheckCircle } from "lucide-react"

export function Billing() {
  const [currentPlan] = useState({
    name: "Pro",
    price: 29,
    billing: "monthly",
    nextBilling: "2024-02-15",
    status: "active",
  })

  const [usage] = useState({
    subdomains: { used: 3, limit: 10 },
    customDomains: { used: 1, limit: 5 },
    bandwidth: { used: 45.2, limit: 100 }, // GB
    storage: { used: 2.1, limit: 10 }, // GB
  })

  const [invoices] = useState([
    { id: "INV-001", date: "2024-01-15", amount: 29, status: "paid" },
    { id: "INV-002", date: "2023-12-15", amount: 29, status: "paid" },
    { id: "INV-003", date: "2023-11-15", amount: 29, status: "paid" },
  ])

  const plans = [
    {
      name: "Starter",
      price: 9,
      features: ["3 Subdomains", "1 Custom Domain", "10GB Bandwidth", "1GB Storage"],
      current: false,
    },
    {
      name: "Pro",
      price: 29,
      features: ["10 Subdomains", "5 Custom Domains", "100GB Bandwidth", "10GB Storage", "Priority Support"],
      current: true,
    },
    {
      name: "Enterprise",
      price: 99,
      features: [
        "Unlimited Subdomains",
        "Unlimited Custom Domains",
        "1TB Bandwidth",
        "100GB Storage",
        "24/7 Support",
        "White-label",
      ],
      current: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription, usage, and billing information</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge variant={currentPlan.status === "active" ? "default" : "destructive"}>{currentPlan.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{currentPlan.name} Plan</h3>
              <p className="text-gray-600">
                ${currentPlan.price}/{currentPlan.billing}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Next billing date</p>
              <p className="font-medium">{currentPlan.nextBilling}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Change Plan</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Current usage for your billing period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Subdomains</span>
                <span className="text-sm text-gray-600">
                  {usage.subdomains.used}/{usage.subdomains.limit}
                </span>
              </div>
              <Progress value={(usage.subdomains.used / usage.subdomains.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Custom Domains</span>
                <span className="text-sm text-gray-600">
                  {usage.customDomains.used}/{usage.customDomains.limit}
                </span>
              </div>
              <Progress value={(usage.customDomains.used / usage.customDomains.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Bandwidth</span>
                <span className="text-sm text-gray-600">
                  {usage.bandwidth.used}GB/{usage.bandwidth.limit}GB
                </span>
              </div>
              <Progress value={(usage.bandwidth.used / usage.bandwidth.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-gray-600">
                  {usage.storage.used}GB/{usage.storage.limit}GB
                </span>
              </div>
              <Progress value={(usage.storage.used / usage.storage.limit) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or downgrade your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`border rounded-lg p-4 ${plan.current ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.current && <Badge>Current</Badge>}
                </div>
                <p className="text-2xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button className="w-full" variant={plan.price > currentPlan.price ? "default" : "outline"}>
                    {plan.price > currentPlan.price ? "Upgrade" : "Downgrade"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-gray-600">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-medium">${invoice.amount}</span>
                  <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>{invoice.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
