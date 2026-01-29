"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Wrench,
} from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"
import { getSiteSettings, updateGeneralSettings } from "@/app/site-settings-actions"

interface SiteVisibilityProps {
  selectedSubdomain: string | null
}

type VisibilityStatus = "public" | "private" | "maintenance"

const visibilityOptions = [
  {
    value: "public" as const,
    label: "Live",
    icon: Eye,
    description: "Your site is live and visible to everyone on the internet",
    color: "bg-green-500",
    borderColor: "border-green-500",
    bgColor: "bg-green-50",
  },
  {
    value: "private" as const,
    label: "Private",
    icon: EyeOff,
    description: "Your site is hidden from the public. Only you can access it",
    color: "bg-gray-500",
    borderColor: "border-gray-500",
    bgColor: "bg-gray-50",
  },
  {
    value: "maintenance" as const,
    label: "Maintenance",
    icon: Wrench,
    description: "Shows a maintenance page to visitors. Use when making updates",
    color: "bg-yellow-500",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-50",
  },
]

export function SiteVisibility({ selectedSubdomain }: SiteVisibilityProps) {
  const [visibility, setVisibility] = useState<VisibilityStatus>("public")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalVisibility, setOriginalVisibility] = useState<VisibilityStatus>("public")

  useEffect(() => {
    if (selectedSubdomain) {
      loadVisibility()
    }
  }, [selectedSubdomain])

  const loadVisibility = async () => {
    if (!selectedSubdomain) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const settings = await getSiteSettings(selectedSubdomain)
      if (settings) {
        const currentVisibility = settings.visibility || "public"
        setVisibility(currentVisibility)
        setOriginalVisibility(currentVisibility)
      }
    } catch (error) {
      console.error("Failed to load visibility:", error)
      setErrorMessage("Failed to load visibility settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisibilityChange = (newVisibility: VisibilityStatus) => {
    setVisibility(newVisibility)
    setHasChanges(newVisibility !== originalVisibility)
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const handleSave = async () => {
    if (!selectedSubdomain) return

    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await updateGeneralSettings(selectedSubdomain, {
        visibility,
      })
      if (result.success) {
        setOriginalVisibility(visibility)
        setHasChanges(false)
        setSuccessMessage(
          visibility === "public"
            ? "Your site is now live!"
            : visibility === "private"
            ? "Your site is now private"
            : "Maintenance mode enabled"
        )
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setErrorMessage(result.error || "Failed to update visibility")
      }
    } catch (error) {
      setErrorMessage("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Site Visibility</h1>
          <p className="text-muted-foreground">Control whether your site is live or hidden</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a site from the sidebar to manage its visibility.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentOption = visibilityOptions.find((opt) => opt.value === visibility)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Site Visibility</h1>
          <p className="text-muted-foreground">
            Control whether{" "}
            <span className="font-medium">{selectedSubdomain}.{rootDomain}</span> is live
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`${protocol}://${selectedSubdomain}.${rootDomain}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Site
        </Button>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card className={`${currentOption?.bgColor} border-2 ${currentOption?.borderColor}`} data-help-key="dashboard.visibility.status">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentOption?.color} text-white`}>
              {currentOption && <currentOption.icon className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Current Status: {currentOption?.label}
              </h3>
              <p className="text-sm text-muted-foreground">{currentOption?.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Options */}
      <Card data-help-key="dashboard.visibility.options">
        <CardHeader>
          <CardTitle>Change Visibility</CardTitle>
          <CardDescription>Select the visibility status for your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {visibilityOptions.map((option) => {
              const Icon = option.icon
              const isSelected = visibility === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => handleVisibilityChange(option.value)}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? `${option.borderColor} ${option.bgColor}`
                      : "border-border hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      isSelected ? option.color : "bg-gray-200"
                    } ${isSelected ? "text-white" : "text-gray-500"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.label}</h4>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
