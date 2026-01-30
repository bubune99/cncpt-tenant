"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  FileText,
  ShoppingCart,
  Briefcase,
  GraduationCap,
  Palette,
  Users,
  Building2,
  Megaphone,
  Code,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Use case options with icons
const USE_CASES = [
  { value: "blog", label: "Blog / Content", icon: FileText, description: "Articles, news, tutorials" },
  { value: "portfolio", label: "Portfolio", icon: Palette, description: "Showcase work and projects" },
  { value: "business", label: "Business Site", icon: Building2, description: "Company website" },
  { value: "ecommerce", label: "E-commerce", icon: ShoppingCart, description: "Online store" },
  { value: "saas", label: "SaaS / Product", icon: Code, description: "Software product site" },
  { value: "agency", label: "Agency", icon: Briefcase, description: "Service agency site" },
  { value: "community", label: "Community", icon: Users, description: "Forums, memberships" },
  { value: "education", label: "Education", icon: GraduationCap, description: "Courses, learning" },
  { value: "marketing", label: "Marketing", icon: Megaphone, description: "Landing pages, campaigns" },
  { value: "other", label: "Other", icon: MoreHorizontal, description: "Something else" },
]

// Industry options
const INDUSTRIES = [
  { value: "technology", label: "Technology & Software" },
  { value: "ecommerce_retail", label: "E-commerce & Retail" },
  { value: "healthcare", label: "Healthcare & Wellness" },
  { value: "finance", label: "Finance & Banking" },
  { value: "education", label: "Education & Training" },
  { value: "media", label: "Media & Entertainment" },
  { value: "real_estate", label: "Real Estate" },
  { value: "travel", label: "Travel & Hospitality" },
  { value: "food", label: "Food & Restaurant" },
  { value: "professional_services", label: "Professional Services" },
  { value: "nonprofit", label: "Non-profit & Charity" },
  { value: "government", label: "Government & Public Sector" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "creative", label: "Creative & Design" },
  { value: "personal", label: "Personal / Individual" },
  { value: "other", label: "Other" },
]

// Referral sources
const REFERRAL_SOURCES = [
  { value: "google", label: "Google Search" },
  { value: "social_media", label: "Social Media" },
  { value: "friend_referral", label: "Friend / Colleague Referral" },
  { value: "blog_article", label: "Blog / Article" },
  { value: "youtube", label: "YouTube" },
  { value: "podcast", label: "Podcast" },
  { value: "conference", label: "Conference / Event" },
  { value: "product_hunt", label: "Product Hunt" },
  { value: "github", label: "GitHub" },
  { value: "other", label: "Other" },
]

// Team size options
const TEAM_SIZES = [
  { value: "solo", label: "Just me" },
  { value: "small", label: "2-5 people" },
  { value: "medium", label: "6-20 people" },
  { value: "large", label: "21-100 people" },
  { value: "enterprise", label: "100+ people" },
]

// Technical experience levels
const TECH_LEVELS = [
  { value: "beginner", label: "Beginner", description: "New to building websites" },
  { value: "intermediate", label: "Intermediate", description: "Some experience with CMS/websites" },
  { value: "advanced", label: "Advanced", description: "Comfortable with technical tools" },
  { value: "developer", label: "Developer", description: "Professional developer" },
]

export interface BusinessInsights {
  useCase: string
  industry: string
  referralSource: string
  referralOther?: string
  teamSize: string
  techExperience: string
}

interface BusinessInsightsFormProps {
  insights: BusinessInsights
  onChange: (insights: BusinessInsights) => void
  disabled?: boolean
}

export function BusinessInsightsForm({
  insights,
  onChange,
  disabled = false,
}: BusinessInsightsFormProps) {
  const updateField = <K extends keyof BusinessInsights>(
    field: K,
    value: BusinessInsights[K]
  ) => {
    onChange({ ...insights, [field]: value })
  }

  return (
    <div className="space-y-8">
      {/* Use Case Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          What will you use this site for? <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {USE_CASES.map((useCase) => {
            const Icon = useCase.icon
            const isSelected = insights.useCase === useCase.value
            return (
              <Card
                key={useCase.value}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected && "border-primary ring-1 ring-primary",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && updateField("useCase", useCase.value)}
              >
                <CardContent className="p-3 text-center">
                  <Icon
                    className={cn(
                      "h-6 w-6 mx-auto mb-2",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <p className="text-sm font-medium">{useCase.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Industry Selection */}
      <div className="space-y-2">
        <Label htmlFor="industry">
          What industry are you in? <span className="text-destructive">*</span>
        </Label>
        <Select
          value={insights.industry}
          onValueChange={(value) => updateField("industry", value)}
          disabled={disabled}
        >
          <SelectTrigger id="industry">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry.value} value={industry.value}>
                {industry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* How did you hear about us */}
      <div className="space-y-2">
        <Label htmlFor="referral">How did you hear about us?</Label>
        <Select
          value={insights.referralSource}
          onValueChange={(value) => updateField("referralSource", value)}
          disabled={disabled}
        >
          <SelectTrigger id="referral">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {REFERRAL_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {insights.referralSource === "other" && (
          <Input
            placeholder="Please specify..."
            value={insights.referralOther || ""}
            onChange={(e) => updateField("referralOther", e.target.value)}
            disabled={disabled}
            className="mt-2"
          />
        )}
      </div>

      {/* Team Size */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Team size</Label>
        <div className="flex flex-wrap gap-3">
          {TEAM_SIZES.map((size) => (
            <Button
              key={size.value}
              type="button"
              variant="outline"
              onClick={() => !disabled && updateField("teamSize", size.value)}
              disabled={disabled}
              className={cn(
                "transition-colors",
                insights.teamSize === size.value
                  ? "border-primary bg-primary/5"
                  : ""
              )}
            >
              {size.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Technical Experience */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Technical experience level</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TECH_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => !disabled && updateField("techExperience", level.value)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center p-3 rounded-md border transition-colors",
                "hover:border-primary/50",
                insights.techExperience === level.value
                  ? "border-primary bg-primary/5"
                  : "border-input",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="font-medium">{level.label}</span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                {level.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
