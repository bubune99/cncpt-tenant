'use client'

/**
 * Storage Settings Component
 *
 * Admin UI for configuring S3/R2/local storage.
 * Credentials are encrypted in the database.
 * Env vars serve as fallback when no DB settings exist.
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  HardDrive,
  Cloud,
  TestTube,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

interface StorageSettingsData {
  provider: 's3' | 'r2' | 'local'
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
  publicUrl?: string
  forcePathStyle?: boolean
  maxFileSize: number
  maxImageSize?: number
  maxVideoSize?: number
  maxAudioSize?: number
  allowedFileTypes: string[]
  tenantIsolation?: boolean
}

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
  { value: 'sa-east-1', label: 'South America (Sao Paulo)' },
  { value: 'auto', label: 'Auto (R2 / S3-compatible)' },
]

const FILE_TYPE_OPTIONS = [
  { value: 'image/*', label: 'Images (all)' },
  { value: 'video/*', label: 'Videos (all)' },
  { value: 'audio/*', label: 'Audio (all)' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'application/msword', label: 'Word (.doc)' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (.docx)' },
  { value: 'application/vnd.ms-excel', label: 'Excel (.xls)' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (.xlsx)' },
  { value: 'text/plain', label: 'Text (.txt)' },
  { value: 'text/csv', label: 'CSV' },
]

export default function StorageSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState<StorageSettingsData>({
    provider: 's3',
    bucket: '',
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',
    endpoint: '',
    publicUrl: '',
    forcePathStyle: false,
    maxFileSize: 500,
    maxImageSize: 50,
    maxVideoSize: 2048,
    maxAudioSize: 500,
    allowedFileTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    tenantIsolation: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/cms/settings/storage')
      const data = await response.json()
      if (data.settings) {
        setForm((prev) => ({
          ...prev,
          ...data.settings,
        }))
      }
    } catch (error) {
      console.error('Error fetching storage settings:', error)
      toast.error('Failed to load storage settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/cms/settings/storage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Storage settings saved successfully')
        if (data.settings) {
          setForm((prev) => ({ ...prev, ...data.settings }))
        }
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving storage settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/cms/settings/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      })

      const data = await response.json()
      setTestResult({ success: data.success, message: data.message })
      if (data.success) {
        toast.success('Connection successful!')
      } else {
        toast.error(data.message || 'Connection failed')
      }
    } catch (error) {
      const message = 'Failed to test connection'
      setTestResult({ success: false, message })
      toast.error(message)
    } finally {
      setTesting(false)
    }
  }

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFileType = (type: string) => {
    setForm((prev) => {
      const types = prev.allowedFileTypes || []
      if (types.includes(type)) {
        return { ...prev, allowedFileTypes: types.filter((t) => t !== type) }
      } else {
        return { ...prev, allowedFileTypes: [...types, type] }
      }
    })
  }

  const renderSecretInput = (
    label: string,
    key: 'accessKeyId' | 'secretAccessKey',
    placeholder: string,
    description?: string
  ) => {
    const value = form[key] || ''
    const isVisible = showSecrets[key]
    const isMasked = value === '********' || value.startsWith('****')

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          <Input
            type={isVisible ? 'text' : 'password'}
            value={value}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={isMasked ? 'Enter new value to change' : placeholder}
          />
          <button
            type="button"
            onClick={() => toggleSecret(key)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {isMasked && (
          <p className="text-xs text-muted-foreground">
            Value is configured. Enter a new value to change it.
          </p>
        )}
        {description && !isMasked && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Provider
          </CardTitle>
          <CardDescription>
            Configure where media files are stored. All credentials are encrypted in the database.
            Environment variables serve as fallback when no database settings exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'local' as const, label: 'Local', icon: HardDrive },
                { value: 's3' as const, label: 'Amazon S3', icon: Cloud },
                { value: 'r2' as const, label: 'Cloudflare R2', icon: Cloud },
              ]).map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={form.provider === value ? 'default' : 'outline'}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      provider: value,
                      // Auto-set R2 defaults
                      ...(value === 'r2' ? { region: 'auto', forcePathStyle: true } : {}),
                      // Auto-set S3 defaults
                      ...(value === 's3' ? { forcePathStyle: false } : {}),
                    }))
                  }}
                  className="w-full"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {form.provider === 'local' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Local Storage</AlertTitle>
              <AlertDescription>
                Files are stored in the <code className="text-xs bg-muted px-1 rounded">public/uploads</code> directory.
                Not recommended for production -- use S3 or R2 for durability and CDN delivery.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bucket & Credentials (S3/R2 only) */}
      {form.provider !== 'local' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {form.provider === 'r2' ? 'Cloudflare R2' : 'Amazon S3'} Configuration
            </CardTitle>
            <CardDescription>
              {form.provider === 'r2'
                ? 'Configure your Cloudflare R2 bucket and API credentials.'
                : 'Configure your S3 bucket, region, and IAM credentials.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bucket Name */}
            <div className="space-y-2">
              <Label>Bucket Name</Label>
              <Input
                value={form.bucket || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, bucket: e.target.value }))}
                placeholder={form.provider === 'r2' ? 'my-r2-bucket' : 'my-s3-bucket'}
              />
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label>Region</Label>
              {form.provider === 'r2' ? (
                <div>
                  <Input value="auto" disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    R2 uses &quot;auto&quot; for region. Cloudflare handles geographic distribution.
                  </p>
                </div>
              ) : (
                <Select
                  value={form.region || 'us-east-1'}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, region: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AWS_REGIONS.filter(r => r.value !== 'auto').map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Endpoint */}
            <div className="space-y-2">
              <Label>
                Endpoint URL
                {form.provider === 'r2' && (
                  <span className="text-xs text-muted-foreground ml-1">(required for R2)</span>
                )}
              </Label>
              <Input
                value={form.endpoint || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, endpoint: e.target.value }))}
                placeholder={
                  form.provider === 'r2'
                    ? 'https://<account-id>.r2.cloudflarestorage.com'
                    : 'https://s3.amazonaws.com (leave empty for standard S3)'
                }
              />
              {form.provider === 'r2' && (
                <p className="text-xs text-muted-foreground">
                  Find your Account ID in the Cloudflare dashboard under R2 &gt; Overview.
                </p>
              )}
            </div>

            <Separator />

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-4">
              {renderSecretInput(
                'Access Key ID',
                'accessKeyId',
                form.provider === 'r2' ? 'R2 API Token ID' : 'AKIAXXXXXXXXXXXXXXXX',
                'Encrypted in the database.'
              )}
              {renderSecretInput(
                'Secret Access Key',
                'secretAccessKey',
                'Your secret key',
                'Encrypted in the database.'
              )}
            </div>

            <Separator />

            {/* Public URL */}
            <div className="space-y-2">
              <Label>
                Public URL
                {form.provider === 'r2' && (
                  <span className="text-xs text-destructive ml-1">(required for R2)</span>
                )}
              </Label>
              <Input
                value={form.publicUrl || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, publicUrl: e.target.value }))}
                placeholder={
                  form.provider === 'r2'
                    ? 'https://pub-xxx.r2.dev or https://cdn.yourdomain.com'
                    : 'https://cdn.yourdomain.com (optional, defaults to S3 URL)'
                }
              />
              {form.provider === 'r2' && (
                <Alert variant="default" className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    R2 requires a public URL to serve files. Configure either:
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>A custom domain connected to your bucket, OR</li>
                      <li>Enable the r2.dev public URL in Cloudflare Dashboard &gt; R2 &gt; Your Bucket &gt; Settings &gt; Public access</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Force Path Style */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Force Path Style</Label>
                <p className="text-sm text-muted-foreground">
                  Required for R2, MinIO, and some S3-compatible providers
                </p>
              </div>
              <Switch
                checked={form.forcePathStyle ?? false}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, forcePathStyle: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Limits</CardTitle>
          <CardDescription>
            Configure maximum file sizes and allowed file types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max File Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>General Max File Size</Label>
              <Badge variant="secondary">{form.maxFileSize} MB</Badge>
            </div>
            <Slider
              value={[form.maxFileSize]}
              onValueChange={([value]) => setForm((prev) => ({ ...prev, maxFileSize: value }))}
              min={1}
              max={5000}
              step={10}
            />
            <p className="text-xs text-muted-foreground">
              Fallback limit for file types without a specific limit.
            </p>
          </div>

          <Separator />

          {/* Per-type limits */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Images</Label>
                <Badge variant="outline" className="text-xs">{form.maxImageSize || 50} MB</Badge>
              </div>
              <Slider
                value={[form.maxImageSize || 50]}
                onValueChange={([value]) => setForm((prev) => ({ ...prev, maxImageSize: value }))}
                min={1}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Videos</Label>
                <Badge variant="outline" className="text-xs">{form.maxVideoSize || 2048} MB</Badge>
              </div>
              <Slider
                value={[form.maxVideoSize || 2048]}
                onValueChange={([value]) => setForm((prev) => ({ ...prev, maxVideoSize: value }))}
                min={50}
                max={10240}
                step={50}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Audio</Label>
                <Badge variant="outline" className="text-xs">{form.maxAudioSize || 500} MB</Badge>
              </div>
              <Slider
                value={[form.maxAudioSize || 500]}
                onValueChange={([value]) => setForm((prev) => ({ ...prev, maxAudioSize: value }))}
                min={10}
                max={2000}
                step={10}
              />
            </div>
          </div>

          <Separator />

          {/* Allowed File Types */}
          <div className="space-y-3">
            <Label>Allowed File Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {FILE_TYPE_OPTIONS.map((option) => {
                const isChecked = (form.allowedFileTypes || []).includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleFileType(option.value)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors text-left ${
                      isChecked
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-muted text-muted-foreground hover:border-foreground/20'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                    )}
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Isolation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Multi-Tenant</CardTitle>
          <CardDescription>
            Isolation settings for multi-tenant deployments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tenant Isolation</Label>
              <p className="text-sm text-muted-foreground">
                Prefix all storage keys with the tenant subdomain. Prevents cross-tenant file access.
              </p>
            </div>
            <Switch
              checked={form.tenantIsolation ?? true}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, tenantIsolation: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Connection Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{testResult.success ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={testing || form.provider === 'local'}
        >
          {testing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
