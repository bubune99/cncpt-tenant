"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, CheckCircle, Info, Sparkles } from "lucide-react"

interface BillingProps {
  // These will come from Stripe via API later
  stripeCustomerPortalUrl?: string
}

export function Billing({ stripeCustomerPortalUrl }: BillingProps) {
  // TODO: Fetch from Stripe API based on user's subscription
  const [currentPlan] = useState({
    name: "Free",
    price: 0,
    billing: "monthly",
    status: "active",
  })

  // TODO: Fetch actual usage from database
  const [usage] = useState({
    subdomains: { used: 0, limit: 3 },
    customDomains: { used: 0, limit: 1 },
  })

  const plans = [
    {
      name: "Free",
      price: 0,
      features: ["3 Subdomains", "1 Custom Domain", "Community Support"],
      current: currentPlan.name === "Free",
    },
    {
      name: "Pro",
      price: 29,
      features: ["10 Subdomains", "5 Custom Domains", "Priority Support", "Custom Branding"],
      current: currentPlan.name === "Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: 99,
      features: [
        "Unlimited Subdomains",
        "Unlimited Custom Domains",
        "24/7 Support",
        "White-label",
        "SLA Guarantee",
      ],
      current: currentPlan.name === "Enterprise",
    },
  ]

  const handleManageSubscription = () => {
    if (stripeCustomerPortalUrl) {
      window.open(stripeCustomerPortalUrl, "_blank")
    } else {
      // Stripe portal not configured yet
      alert("Stripe billing portal will be available soon.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">View your plan and manage your subscription</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All features are free during the beta period. Billing will be handled securely through Stripe.
        </AlertDescription>
      </Alert>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Plan</span>
            <Badge variant={currentPlan.status === "active" ? "default" : "destructive"}>
              {currentPlan.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
              <p className="text-muted-foreground">
                {currentPlan.price === 0 ? "Free forever" : `$${currentPlan.price}/${currentPlan.billing}`}
              </p>
            </div>
            <Button onClick={handleManageSubscription} className="gap-2">
              Manage Subscription
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Upgrade, downgrade, update payment methods, and view invoices through the Stripe customer portal.
          </p>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Current usage for your plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Subdomains</span>
                <span className="text-sm text-muted-foreground">
                  {usage.subdomains.used} / {usage.subdomains.limit}
                </span>
              </div>
              <Progress value={(usage.subdomains.used / usage.subdomains.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Custom Domains</span>
                <span className="text-sm text-muted-foreground">
                  {usage.customDomains.used} / {usage.customDomains.limit}
                </span>
              </div>
              <Progress value={(usage.customDomains.used / usage.customDomains.limit) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Compare plans and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border rounded-lg p-4 ${
                  plan.current
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                {plan.popular && !plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.current && <Badge variant="secondary">Current</Badge>}
                </div>
                <p className="text-2xl font-bold mb-4">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  )}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button onClick={handleManageSubscription} variant="outline" className="gap-2">
              Upgrade or Change Plan
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
