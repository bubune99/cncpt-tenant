"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Copy,
  Globe,
  AlertCircle,
  Loader2,
  Star,
  Info,
} from "lucide-react"
import {
  getDomainsForSubdomain,
  addCustomDomain,
  removeCustomDomain,
  verifyDomainDns,
  setPrimaryDomain,
  type DomainInfo,
} from "@/app/domain-actions"
import { rootDomain, protocol } from "@/lib/utils"

interface DomainManagementProps {
  subdomains: any[]
  selectedSubdomain: string | null
}

export function DomainManagement({ subdomains, selectedSubdomain }: DomainManagementProps) {
  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null)

  const currentSubdomain = subdomains?.find((s) => s.subdomain === selectedSubdomain)

  useEffect(() => {
    if (currentSubdomain?.id) {
      loadDomains()
    }
  }, [currentSubdomain?.id])

  const loadDomains = async () => {
    if (!currentSubdomain?.id) return

    setIsLoading(true)
    try {
      const result = await getDomainsForSubdomain(currentSubdomain.id)
      setDomains(result)
    } catch (e) {
      console.error("Failed to load domains:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!currentSubdomain?.id || !newDomain) return

    setIsAdding(true)
    setError(null)

    try {
      const result = await addCustomDomain(currentSubdomain.id, newDomain)
      if (result.success && result.domain) {
        setDomains([...domains, result.domain])
        setNewDomain("")
        setSuccessMessage(`Domain ${newDomain} added successfully!`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(result.error || "Failed to add domain")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add domain")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveDomain = async (domain: string) => {
    if (!currentSubdomain?.id) return
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return

    try {
      const result = await removeCustomDomain(currentSubdomain.id, domain)
      if (result.success) {
        setDomains(domains.filter((d) => d.domain !== domain))
        setSuccessMessage(`Domain ${domain} removed`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(result.error || "Failed to remove domain")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove domain")
    }
  }

  const handleVerifyDomain = async (domain: string) => {
    if (!currentSubdomain?.id) return

    setVerifyingDomain(domain)
    try {
      const result = await verifyDomainDns(currentSubdomain.id, domain)
      if (result.success) {
        // Reload domains to get updated status
        await loadDomains()
        if (result.status?.verified) {
          setSuccessMessage(`Domain ${domain} verified successfully!`)
        } else {
          setError("DNS not yet configured. Please check your DNS settings.")
        }
        setTimeout(() => {
          setSuccessMessage(null)
          setError(null)
        }, 5000)
      } else {
        setError(result.error || "Verification failed")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed")
    } finally {
      setVerifyingDomain(null)
    }
  }

  const handleSetPrimary = async (domain: string) => {
    if (!currentSubdomain?.id) return

    try {
      const result = await setPrimaryDomain(currentSubdomain.id, domain)
      if (result.success) {
        setDomains(
          domains.map((d) => ({
            ...d,
            is_primary: d.domain === domain,
          }))
        )
        setSuccessMessage(`${domain} set as primary domain`)
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set primary domain")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage("Copied to clipboard!")
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Domain Management</h1>
          <p className="text-muted-foreground">Configure custom domains for your site</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a site from the sidebar to manage its domains.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Domain Management</h1>
          <p className="text-muted-foreground">
            Configure custom domains for <span className="font-medium">{selectedSubdomain}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDomains} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Default Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Default Subdomain
          </CardTitle>
          <CardDescription>Your site is always accessible at this address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{selectedSubdomain}.{rootDomain}</p>
                <p className="text-sm text-muted-foreground">SSL Active • Always available</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`${protocol}://${selectedSubdomain}.${rootDomain}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Domain
          </CardTitle>
          <CardDescription>Connect your own domain to this site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="yourdomain.com or sub.yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                disabled={isAdding}
              />
            </div>
            <Button onClick={handleAddDomain} disabled={isAdding || !newDomain}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </>
              )}
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Before adding a domain</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Make sure you have access to your domain's DNS settings. After adding, you'll need to:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Add the required DNS records at your domain registrar</li>
                <li>Wait for DNS propagation (usually 1-48 hours)</li>
                <li>Click "Verify" to confirm the configuration</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Custom Domains List */}
      {domains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Domains</CardTitle>
            <CardDescription>Manage your connected domains</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onVerify={() => handleVerifyDomain(domain.domain)}
                onRemove={() => handleRemoveDomain(domain.domain)}
                onSetPrimary={() => handleSetPrimary(domain.domain)}
                onCopy={copyToClipboard}
                isVerifying={verifyingDomain === domain.domain}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* DNS Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Configuration Guide</CardTitle>
          <CardDescription>How to configure your domain's DNS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Option 1</Badge>
                Root Domain (yourdomain.com)
              </h4>
              <p className="text-sm text-muted-foreground">
                For apex/root domains, add an A record:
              </p>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>@</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value:</span>
                  <span>76.76.21.21</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Option 2</Badge>
                Subdomain (www.yourdomain.com)
              </h4>
              <p className="text-sm text-muted-foreground">
                For subdomains like www, add a CNAME record:
              </p>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>CNAME</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>www</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value:</span>
                  <span>cname.vercel-dns.com</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Common DNS Providers:</strong></p>
            <div className="flex flex-wrap gap-2">
              {["Cloudflare", "GoDaddy", "Namecheap", "Google Domains", "Route 53"].map((provider) => (
                <Badge key={provider} variant="secondary">{provider}</Badge>
              ))}
            </div>
            <p className="mt-3">
              DNS changes can take 1-48 hours to propagate worldwide. If verification fails, wait a few hours and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Domain Card Component
function DomainCard({
  domain,
  onVerify,
  onRemove,
  onSetPrimary,
  onCopy,
  isVerifying,
}: {
  domain: DomainInfo
  onVerify: () => void
  onRemove: () => void
  onSetPrimary: () => void
  onCopy: (text: string) => void
  isVerifying: boolean
}) {
  const isVerified = domain.status === "active" || domain.vercel_status?.verified
  const sslActive = domain.ssl_status === "active" || domain.vercel_status?.sslReady
  const needsConfig = !isVerified && domain.vercel_status?.dnsRecords

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Domain Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{domain.domain}</span>
              {domain.is_primary && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {/* Verification Status */}
              <span className="flex items-center gap-1 text-xs">
                {isVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Verified</span>
                  </>
                ) : domain.status === "verifying" ? (
                  <>
                    <Clock className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-600">Verifying</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 text-orange-500" />
                    <span className="text-orange-600">Pending DNS</span>
                  </>
                )}
              </span>

              {/* SSL Status */}
              <span className="flex items-center gap-1 text-xs">
                {sslActive ? (
                  <>
                    <Shield className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">SSL Active</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">SSL Pending</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVerified && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://${domain.domain}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {!domain.is_primary && isVerified && (
            <Button variant="ghost" size="sm" onClick={onSetPrimary}>
              <Star className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onVerify} disabled={isVerifying}>
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* DNS Configuration (if not verified) */}
      {needsConfig && (
        <div className="p-4 bg-amber-50 border-t border-amber-100">
          <p className="text-sm font-medium text-amber-800 mb-3">
            Configure these DNS records at your domain registrar:
          </p>
          <div className="space-y-2">
            {domain.vercel_status?.dnsRecords.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-4 font-mono text-sm">
                  <Badge variant="outline">{record.type}</Badge>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{record.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{record.value}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onCopy(record.value)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Verification TXT record if needed */}
            {domain.vercel_status?.verificationRecords.map((record, idx) => (
              <div key={`txt-${idx}`} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-4 font-mono text-sm">
                  <Badge variant="outline">{record.type}</Badge>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{record.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium truncate max-w-[200px]">{record.value}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onCopy(record.value)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            className="mt-3"
            onClick={onVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking DNS...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verify DNS Configuration
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
