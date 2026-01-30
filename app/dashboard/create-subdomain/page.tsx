"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Check,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Globe,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
} from "lucide-react"
import { PlanCard } from "@/components/dashboard/plan-card"
import { SiteConfigForm, type SiteConfig } from "@/components/dashboard/site-config-form"
import { BusinessInsightsForm, type BusinessInsights } from "@/components/dashboard/business-insights-form"
import type { SubscriptionTier } from "@/types/admin"

const STEPS = [
  { number: 1, title: "Choose Plan", icon: CreditCard },
  { number: 2, title: "Site Setup", icon: Globe },
  { number: 3, title: "About Your Project", icon: Building2 },
  { number: 4, title: "Review & Create", icon: Settings },
]

interface UsageData {
  used: number
  limit: number
  remaining: number
  canCreate: boolean
}

interface SubscriptionData {
  tierId: string | null
  tierName: string
  priceMonthly: number
}

// Wrapper component to handle Suspense for useSearchParams
export default function CreateSubdomainPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CreateSubdomainContent />
    </Suspense>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

function CreateSubdomainContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)

  // Form state
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    subdomain: "",
    siteName: "",
    siteDescription: "",
    contactEmail: "",
    timezone: "UTC",
    primaryLanguage: "en",
    customDomain: undefined,
  })
  const [businessInsights, setBusinessInsights] = useState<BusinessInsights>({
    useCase: "",
    industry: "",
    referralSource: "",
    teamSize: "solo",
    techExperience: "intermediate",
  })
  const [configErrors, setConfigErrors] = useState<Partial<Record<keyof SiteConfig, string>>>({})

  // Subdomain availability
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  // Action state
  const [checkingOut, setCheckingOut] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sessionVerified, setSessionVerified] = useState(false)

  // Domain for preview
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "cncpt.io"

  // Check for Stripe session on mount
  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    const canceled = searchParams.get("canceled")

    if (canceled) {
      setError("Payment was canceled. Please try again or select a different plan.")
    }

    if (sessionId) {
      verifyCheckoutSession(sessionId)
    } else {
      loadInitialData()
    }
  }, [searchParams])

  // Check subdomain availability when it changes
  useEffect(() => {
    if (siteConfig.subdomain.length >= 3) {
      const timer = setTimeout(() => checkAvailability(siteConfig.subdomain), 500)
      return () => clearTimeout(timer)
    } else {
      setIsAvailable(null)
    }
  }, [siteConfig.subdomain])

  // Load initial data
  async function loadInitialData() {
    setLoading(true)
    try {
      const [tiersRes, subdomainRes] = await Promise.all([
        fetch("/api/admin/tiers"),
        fetch("/api/dashboard/subdomain"),
      ])

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json()
        setTiers(tiersData.tiers || tiersData)
      }

      if (subdomainRes.ok) {
        const subdomainData = await subdomainRes.json()
        setUsage(subdomainData.usage)
      }

      const subRes = await fetch("/api/dashboard/subscription/current")
      if (subRes.ok) {
        const subData = await subRes.json()
        setCurrentSubscription(subData)
        setSelectedTierId(subData.tierId)
        // Pre-fill contact email if available
        if (subData.email) {
          setSiteConfig((prev) => ({ ...prev, contactEmail: subData.email }))
        }
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load plan information. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  // Verify Stripe checkout session
  async function verifyCheckoutSession(sessionId: string) {
    try {
      const res = await fetch(`/api/dashboard/subscription/checkout?session_id=${sessionId}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setSessionVerified(true)
        setSelectedTierId(data.tier?.id || null)
        setStep(2)
      } else {
        setError(data.error || "Failed to verify payment. Please try again.")
      }
    } catch (err) {
      console.error("Error verifying session:", err)
      setError("Failed to verify payment. Please try again.")
    } finally {
      loadInitialData()
    }
  }

  // Check subdomain availability
  async function checkAvailability(subdomain: string) {
    setCheckingAvailability(true)
    try {
      const res = await fetch(`/api/dashboard/subdomain/check?subdomain=${encodeURIComponent(subdomain)}`)
      const data = await res.json()
      setIsAvailable(data.available && !data.taken)
    } catch {
      setIsAvailable(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  // Validate site config before proceeding
  function validateSiteConfig(): boolean {
    const errors: Partial<Record<keyof SiteConfig, string>> = {}

    if (!siteConfig.subdomain || siteConfig.subdomain.length < 3) {
      errors.subdomain = "Subdomain must be at least 3 characters"
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(siteConfig.subdomain)) {
      errors.subdomain = "Only lowercase letters, numbers, and hyphens"
    } else if (isAvailable === false) {
      errors.subdomain = "This subdomain is already taken"
    }

    if (!siteConfig.siteName.trim()) {
      errors.siteName = "Site name is required"
    }

    if (!siteConfig.contactEmail.trim()) {
      errors.contactEmail = "Contact email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteConfig.contactEmail)) {
      errors.contactEmail = "Please enter a valid email address"
    }

    setConfigErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle plan selection
  async function handleSelectPlan(tierId: string) {
    const tier = tiers.find((t) => t.id === tierId)
    if (!tier) return

    if (tier.priceMonthly === 0) {
      setSelectedTierId(tierId)
      setStep(2)
      return
    }

    setCheckingOut(true)
    setError(null)

    try {
      const res = await fetch("/api/dashboard/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "STRIPE_NOT_CONFIGURED") {
          setSelectedTierId(tierId)
          setStep(2)
          return
        }
        throw new Error(data.error || "Failed to start checkout")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err instanceof Error ? err.message : "Failed to start checkout")
    } finally {
      setCheckingOut(false)
    }
  }

  // Handle subdomain creation
  async function handleCreate() {
    if (!validateSiteConfig()) return
    if (!businessInsights.useCase || !businessInsights.industry) {
      setError("Please complete all required fields")
      return
    }

    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/dashboard/subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...siteConfig,
          ...businessInsights,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "PLAN_LIMIT_REACHED") {
          setStep(1)
          throw new Error(data.error || "Please upgrade your plan to create more subdomains.")
        }
        throw new Error(data.error || "Failed to create subdomain")
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Create error:", err)
      setError(err instanceof Error ? err.message : "Failed to create subdomain")
    } finally {
      setCreating(false)
    }
  }

  // Navigation helpers
  function canProceedToStep3(): boolean {
    return (
      siteConfig.subdomain.length >= 3 &&
      siteConfig.siteName.trim() !== "" &&
      siteConfig.contactEmail.trim() !== "" &&
      isAvailable !== false
    )
  }

  function canProceedToStep4(): boolean {
    return businessInsights.useCase !== "" && businessInsights.industry !== ""
  }

  // Get current tier info
  const currentTier = tiers.find((t) => t.id === currentSubscription?.tierId)
  const selectedTier = tiers.find((t) => t.id === selectedTierId)

  // Loading state
  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Site</h1>
            <p className="text-muted-foreground">
              Set up your new site in a few simple steps
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert (after payment) */}
        {sessionVerified && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Payment Successful!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your subscription has been activated. Let's set up your site.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((stepItem, index) => (
              <div key={stepItem.number} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    step >= stepItem.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <stepItem.icon className="h-4 w-4" />
                  <span className="font-medium hidden sm:inline text-sm">{stepItem.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-6 sm:w-10 h-0.5 mx-1 transition-colors ${
                      step > stepItem.number ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={(step / STEPS.length) * 100} className="mt-4 h-1" />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Choose Plan */}
          {step === 1 && (
            <div className="space-y-6">
              {usage && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Current Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Sites</p>
                        <p className="text-2xl font-bold">
                          {usage.used}{" "}
                          <span className="text-muted-foreground text-lg font-normal">
                            / {usage.limit === -1 ? "∞" : usage.limit}
                          </span>
                        </p>
                      </div>
                      {currentTier && (
                        <Badge variant="outline" className="text-base">
                          {currentTier.displayName} Plan
                        </Badge>
                      )}
                    </div>
                    {!usage.canCreate && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You've reached your site limit. Upgrade to create more.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {usage?.canCreate ? "Select Your Plan" : "Upgrade to Continue"}
                </h2>
                <p className="text-muted-foreground">
                  {usage?.canCreate
                    ? "Choose the plan that best fits your needs"
                    : "Select a higher plan to create more sites"}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {tiers.map((tier) => {
                  const isCurrentPlan = tier.id === currentSubscription?.tierId
                  const isUpgrade = tier.priceMonthly > (currentTier?.priceMonthly || 0)
                  const canSelect = usage?.canCreate || isUpgrade

                  return (
                    <PlanCard
                      key={tier.id}
                      tier={tier}
                      isCurrentPlan={isCurrentPlan}
                      isRecommended={tier.name === "pro"}
                      isLoading={checkingOut && selectedTierId === tier.id}
                      onSelect={handleSelectPlan}
                      disabled={!canSelect || checkingOut}
                    />
                  )
                })}
              </div>

              {usage?.canCreate && currentTier && (
                <div className="text-center mt-4">
                  <Button variant="link" onClick={() => setStep(2)}>
                    Continue with {currentTier.displayName} plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Site Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Configure Your Site</h2>
                <p className="text-muted-foreground">
                  Set up the basic details for your new site
                </p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Site Details</CardTitle>
                  <CardDescription>
                    These settings will be used to initialize your CMS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SiteConfigForm
                    config={siteConfig}
                    onChange={setSiteConfig}
                    errors={configErrors}
                    disabled={creating}
                    domain={domain}
                  />

                  {/* Availability indicator */}
                  {siteConfig.subdomain.length >= 3 && (
                    <div className="mt-4 flex items-center gap-2">
                      {checkingAvailability ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Checking availability...
                          </span>
                        </>
                      ) : isAvailable === true ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">
                            {siteConfig.subdomain}.{domain} is available!
                          </span>
                        </>
                      ) : isAvailable === false ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            This subdomain is already taken
                          </span>
                        </>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between max-w-2xl mx-auto">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (validateSiteConfig()) setStep(3)
                  }}
                  disabled={!canProceedToStep3()}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Business Insights */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">About Your Project</h2>
                <p className="text-muted-foreground">
                  Help us understand your needs to provide the best experience
                </p>
              </div>

              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    This helps us customize features and provide relevant recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BusinessInsightsForm
                    insights={businessInsights}
                    onChange={setBusinessInsights}
                    disabled={creating}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between max-w-3xl mx-auto">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!canProceedToStep4()}>
                  Review & Create
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Review Your Site</h2>
                <p className="text-muted-foreground">
                  Please review your settings before creating
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                {/* Plan Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">
                          {selectedTier?.displayName || currentTier?.displayName || "Free"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTier?.priceMonthly === 0
                            ? "Free forever"
                            : `$${selectedTier?.priceMonthly}/month`}
                        </p>
                      </div>
                      {sessionVerified && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Site Config Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Site Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">URL</p>
                        <p className="font-medium">
                          {siteConfig.subdomain}.{domain}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Site Name</p>
                        <p className="font-medium">{siteConfig.siteName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contact Email</p>
                        <p className="font-medium">{siteConfig.contactEmail}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Timezone</p>
                        <p className="font-medium">{siteConfig.timezone}</p>
                      </div>
                    </div>
                    {siteConfig.siteDescription && (
                      <div>
                        <p className="text-muted-foreground text-sm">Description</p>
                        <p className="text-sm">{siteConfig.siteDescription}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Insights Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Use Case</p>
                        <p className="font-medium capitalize">
                          {businessInsights.useCase.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Industry</p>
                        <p className="font-medium capitalize">
                          {businessInsights.industry.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Team Size</p>
                        <p className="font-medium capitalize">{businessInsights.teamSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-medium capitalize">{businessInsights.techExperience}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Features Preview */}
                {selectedTier && selectedTier.features.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Included Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-2 gap-2">
                        {selectedTier.features.slice(0, 6).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} disabled={creating}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCreate}
                    disabled={creating}
                    className="min-w-[200px]"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Site
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
