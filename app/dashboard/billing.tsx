"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, CheckCircle, Info, Sparkles, Loader2 } from "lucide-react"
import { PLANS, planFor, usagePercent } from "@/lib/billing/plans"

/** What /api/dashboard/subscription/current returns (the parts this page shows). */
interface CurrentSubscription {
  tierDisplayName: string
  priceMonthly: number
  subscriptionStatus: string
  limits: { custom_domains?: number }
  usage: { subdomains: { used: number; limit: number } }
}

export function Billing() {
  // The plan and usage come from the account's stored subscription; nothing is shown until it arrives.
  const [sub, setSub] = useState<CurrentSubscription | null>(null)
  const [subError, setSubError] = useState(false)
  const [opening, setOpening] = useState(false)
  const [portalError, setPortalError] = useState<{ text: string; choosePlan: boolean } | null>(null)

  useEffect(() => {
    let live = true
    fetch("/api/dashboard/subscription/current", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: CurrentSubscription) => { if (live) setSub(d) })
      .catch(() => { if (live) setSubError(true) })
    return () => { live = false }
  }, [])

  const currentPlan = {
    name: sub ? sub.tierDisplayName : "—",
    price: sub ? sub.priceMonthly : 0,
    status: sub ? (sub.subscriptionStatus === "none" ? "no plan" : sub.subscriptionStatus) : "—",
  }

  // The plans Pricing sells (lib/billing/plans); "Current" only when the stored plan is one of them.
  const currentSlug = planFor(sub?.tierDisplayName)?.slug
  const plans = PLANS.map((p) => ({
    name: p.name,
    price: p.price,
    features: p.features.map((f) => f.text),
    current: p.slug === currentSlug,
    popular: p.popular,
  }))

  // Both buttons open the Stripe customer portal (owner, 2026-11-22).
  const handleManageSubscription = async () => {
    setOpening(true)
    setPortalError(null)
    try {
      const r = await fetch("/api/dashboard/subscription/portal", { method: "POST" })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.url) { window.location.href = d.url; return }
      if (d.code === "NO_BILLING_ACCOUNT") setPortalError({ text: "You haven't chosen a paid plan yet, so there is no billing account to manage.", choosePlan: true })
      else setPortalError({ text: "The billing portal couldn't be opened just now. Please try again in a minute.", choosePlan: false })
    } catch {
      setPortalError({ text: "The billing portal couldn't be opened just now. Please try again in a minute.", choosePlan: false })
    }
    setOpening(false)
  }

  const portalMessage = portalError ? (
    <p role="alert" className="text-sm text-destructive mt-3" data-ui="billing.portal_error">
      {portalError.text}{" "}
      {portalError.choosePlan ? <Link href="/pricing" className="underline font-medium">See plans</Link> : null}
    </p>
  ) : null

  return (
    <div className="space-y-6" data-tour-id="billing-page">
      <div>
        <h1 className="text-2xl font-bold" data-tour-id="billing-heading">Billing & Subscription</h1>
        <p className="text-muted-foreground">View your plan and manage your subscription</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All features are free during the beta period. Billing will be handled securely through Stripe.
        </AlertDescription>
      </Alert>

      {/* Current Plan */}
      <Card data-help-key="dashboard.billing.plan" data-tour-id="billing-plan-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Plan</span>
            <Badge variant={currentPlan.status === "active" || currentPlan.status === "trialing" ? "default" : "secondary"}>
              {currentPlan.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
              <p className="text-muted-foreground">
                {!sub ? (subError ? "Your plan couldn't be loaded." : "Loading your plan…") : currentPlan.price === 0 ? "No paid plan" : `$${currentPlan.price}/month`}
              </p>
            </div>
            <Button onClick={handleManageSubscription} disabled={opening} className="gap-2" data-help-key="dashboard.billing.manage" data-tour-id="billing-manage-subscription">
              {opening ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
              Manage Subscription
              <ExternalLink className="w-4 h-4" aria-hidden />
            </Button>
          </div>
          {portalMessage}
          <p className="text-sm text-muted-foreground">
            Upgrade, downgrade, update payment methods, and view invoices through the Stripe customer portal.
          </p>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card data-help-key="dashboard.billing.usage" data-tour-id="billing-usage-card">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Current usage for your plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Subdomains</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {sub ? `${sub.usage.subdomains.used} / ${sub.usage.subdomains.limit < 0 ? "unlimited" : sub.usage.subdomains.limit}` : "—"}
                </span>
              </div>
              <Progress
                value={sub ? usagePercent(sub.usage.subdomains.used, sub.usage.subdomains.limit) : 0}
                className="h-2"
                aria-label="Subdomains used"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Custom Domains</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {sub && typeof sub.limits.custom_domains === "number" ? `Up to ${sub.limits.custom_domains < 0 ? "unlimited" : sub.limits.custom_domains}` : "—"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card data-help-key="dashboard.billing.plans" data-tour-id="billing-plans-card">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Compare plans and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                data-tour-id={`billing-plan-${plan.name.toLowerCase()}`}
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
            <Button onClick={handleManageSubscription} disabled={opening} variant="outline" className="gap-2" data-tour-id="billing-upgrade-button">
              {opening ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
              Upgrade or Change Plan
              <ExternalLink className="w-4 h-4" aria-hidden />
            </Button>
            {portalMessage}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
