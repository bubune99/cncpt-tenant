"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Download, Calendar, CheckCircle, Info } from "lucide-react"

export function Billing() {
  // Demo data - billing integration coming soon
  const [currentPlan] = useState({
    name: "Free",
    price: 0,
    billing: "monthly",
    nextBilling: null,
    status: "active",
  })

  const [usage] = useState({
    subdomains: { used: 0, limit: 3 },
    customDomains: { used: 0, limit: 1 },
    bandwidth: { used: 0, limit: 10 }, // GB
    storage: { used: 0, limit: 1 }, // GB
  })

  const [invoices] = useState<{ id: string; date: string; amount: number; status: string }[]>([])

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
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, usage, and billing information</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Billing is currently in preview mode. All features are free during the beta period.
        </AlertDescription>
      </Alert>

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
              <p className="text-muted-foreground">
                {currentPlan.price === 0 ? "Free" : `$${currentPlan.price}/${currentPlan.billing}`}
              </p>
            </div>
            {currentPlan.nextBilling && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Next billing date</p>
                <p className="font-medium">{currentPlan.nextBilling}</p>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" disabled>Change Plan</Button>
            <Button variant="outline" disabled>Cancel Subscription</Button>
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
                <span className="text-sm text-muted-foreground">
                  {usage.subdomains.used}/{usage.subdomains.limit}
                </span>
              </div>
              <Progress value={(usage.subdomains.used / usage.subdomains.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Custom Domains</span>
                <span className="text-sm text-muted-foreground">
                  {usage.customDomains.used}/{usage.customDomains.limit}
                </span>
              </div>
              <Progress value={(usage.customDomains.used / usage.customDomains.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Bandwidth</span>
                <span className="text-sm text-muted-foreground">
                  {usage.bandwidth.used}GB/{usage.bandwidth.limit}GB
                </span>
              </div>
              <Progress value={(usage.bandwidth.used / usage.bandwidth.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-muted-foreground">
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
                className={`border rounded-lg p-4 ${plan.current ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.current && <Badge>Current</Badge>}
                </div>
                <p className="text-2xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
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
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No payment method required during beta</p>
            <Button variant="outline" className="mt-4" disabled>Add Payment Method</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No billing history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
