"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowLeft, CreditCard, Globe, Settings } from "lucide-react"
import { createSubdomainAction } from "@/app/actions"

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$9/month",
    features: ["Custom subdomain", "Basic analytics", "1GB storage", "Email support"],
    recommended: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29/month",
    features: ["Custom subdomain", "Advanced analytics", "10GB storage", "Priority support", "Custom domain"],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99/month",
    features: ["Multiple subdomains", "Enterprise analytics", "Unlimited storage", "24/7 support", "White-label"],
    recommended: false,
  },
]

const EMOJI_OPTIONS = ["🚀", "💡", "🎯", "⭐", "🔥", "💎", "🌟", "🎨", "📱", "💻", "🌈", "🎪"]

export default function CreateSubdomainPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState("pro")
  const [subdomain, setSubdomain] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🚀")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateSubdomain = async () => {
    if (!subdomain.trim()) return

    setIsCreating(true)
    try {
      const result = await createSubdomainAction(subdomain, selectedEmoji)
      if (result.success) {
        router.push("/dashboard")
      } else {
        console.error("Failed to create subdomain:", result.error)
      }
    } catch (error) {
      console.error("Error creating subdomain:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const steps = [
    { number: 1, title: "Choose Plan", icon: CreditCard },
    { number: 2, title: "Configure Subdomain", icon: Globe },
    { number: 3, title: "Review & Create", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold">Create New Subdomain</h1>
            <p className="text-muted-foreground">Set up your new subdomain with billing and configuration</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((stepItem, index) => (
            <div key={stepItem.number} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  step >= stepItem.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <stepItem.icon className="h-4 w-4" />
                <span className="font-medium">{stepItem.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${step > stepItem.number ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-muted-foreground">Select the plan that best fits your needs</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === plan.id ? "ring-2 ring-primary" : ""
                    } ${plan.recommended ? "border-primary" : ""}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.recommended && <Badge variant="default">Recommended</Badge>}
                      </div>
                      <CardDescription className="text-2xl font-bold text-foreground">{plan.price}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} size="lg">
                  Continue to Configuration
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Configure Your Subdomain</h2>
                <p className="text-muted-foreground">Choose your subdomain name and emoji</p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Subdomain Details</CardTitle>
                  <CardDescription>
                    Your subdomain will be accessible at {subdomain || "yourname"}.yourdomain.com
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain Name</Label>
                    <Input
                      id="subdomain"
                      placeholder="Enter subdomain name"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Choose Emoji</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <Button
                          key={emoji}
                          variant={selectedEmoji === emoji ? "default" : "outline"}
                          size="lg"
                          onClick={() => setSelectedEmoji(emoji)}
                          className="text-2xl"
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{selectedEmoji}</span>
                      <span className="font-medium">{subdomain || "yourname"}.yourdomain.com</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between max-w-2xl mx-auto">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back to Plans
                </Button>
                <Button onClick={() => setStep(3)} disabled={!subdomain.trim()}>
                  Review & Create
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Review Your Configuration</h2>
                <p className="text-muted-foreground">Please review your settings before creating the subdomain</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plan Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{PLANS.find((p) => p.id === selectedPlan)?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {PLANS.find((p) => p.id === selectedPlan)?.price}
                        </p>
                      </div>
                      <Badge variant="outline">Selected</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subdomain Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <span className="text-3xl">{selectedEmoji}</span>
                        <div>
                          <p className="font-medium">{subdomain}.yourdomain.com</p>
                          <p className="text-sm text-muted-foreground">Your new subdomain</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back to Configuration
                  </Button>
                  <Button onClick={handleCreateSubdomain} disabled={isCreating} size="lg">
                    {isCreating ? "Creating..." : "Create Subdomain"}
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
