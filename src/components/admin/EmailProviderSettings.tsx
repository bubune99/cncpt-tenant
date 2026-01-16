'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Server,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'

interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun' | 'ses'
  fromName?: string
  fromEmail?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  smtpSecure?: boolean
  sendgridApiKey?: string
  resendApiKey?: string
  mailgunApiKey?: string
  mailgunDomain?: string
  sesAccessKeyId?: string
  sesSecretAccessKey?: string
  sesRegion?: string
}

interface EnvVar {
  name: string
  configured: boolean
  required: boolean
  group: string
  description: string
}

export default function EmailProviderSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState<EmailSettings>({
    provider: 'smtp',
    fromName: '',
    fromEmail: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    sendgridApiKey: '',
    resendApiKey: '',
    mailgunApiKey: '',
    mailgunDomain: '',
    sesAccessKeyId: '',
    sesSecretAccessKey: '',
    sesRegion: 'us-east-1',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (data.success) {
        if (data.settings.email) {
          setForm((prev) => ({
            ...prev,
            ...data.settings.email,
          }))
        }
        if (data.settings.envVars) {
          setEnvVars(data.settings.envVars.filter((v: EnvVar) => v.group === 'email'))
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load email settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'email',
          settings: form,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Email settings saved successfully')
        // Update form with masked values
        if (data.settings.email) {
          setForm((prev) => ({
            ...prev,
            ...data.settings.email,
          }))
        }
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.fromEmail,
          subject: 'Test Email from CMS',
          content: '<h1>Test Email</h1><p>Your email configuration is working correctly!</p>',
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Test email sent to ${form.fromEmail}`)
      } else {
        toast.error(data.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Failed to send test email')
    } finally {
      setTesting(false)
    }
  }

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderSecretInput = (
    label: string,
    key: keyof EmailSettings,
    placeholder: string
  ) => {
    const value = (form[key] as string) || ''
    const isVisible = showSecrets[key]
    const isMasked = value === '********'

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Provider
          </CardTitle>
          <CardDescription>
            Configure your email sending provider. SMTP (nodemailer) allows unlimited sending with your own mail server.
            All credentials are encrypted in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Email Provider</Label>
            <div className="grid grid-cols-5 gap-2">
              {(['smtp', 'sendgrid', 'resend', 'mailgun', 'ses'] as const).map((provider) => (
                <Button
                  key={provider}
                  variant={form.provider === provider ? 'default' : 'outline'}
                  onClick={() => setForm((prev) => ({ ...prev, provider }))}
                  className="w-full"
                >
                  {provider === 'smtp' ? 'SMTP' : provider === 'ses' ? 'AWS SES' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* From Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={form.fromName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, fromName: e.target.value }))}
                placeholder="Your Company"
              />
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                type="email"
                value={form.fromEmail || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@yourdomain.com"
              />
            </div>
          </div>

          {/* SMTP Settings */}
          {form.provider === 'smtp' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <h3 className="font-medium">SMTP Settings (Nodemailer)</h3>
              </div>
              <Alert>
                <AlertDescription>
                  Use your own mail server for unlimited email sending without per-email costs.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={form.smtpHost || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.yourdomain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={form.smtpPort || 587}
                    onChange={(e) => setForm((prev) => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input
                    value={form.smtpUser || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, smtpUser: e.target.value }))}
                    placeholder="username"
                  />
                </div>
                {renderSecretInput('SMTP Password', 'smtpPass', 'Enter password')}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp-secure"
                  checked={form.smtpSecure || false}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, smtpSecure: checked }))}
                />
                <Label htmlFor="smtp-secure">Use TLS/SSL (typically port 465)</Label>
              </div>
            </div>
          )}

          {/* SendGrid Settings */}
          {form.provider === 'sendgrid' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">SendGrid Settings</h3>
              {renderSecretInput('API Key', 'sendgridApiKey', 'SG.xxxxxx')}
            </div>
          )}

          {/* Resend Settings */}
          {form.provider === 'resend' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Resend Settings</h3>
              {renderSecretInput('API Key', 'resendApiKey', 're_xxxxxx')}
            </div>
          )}

          {/* Mailgun Settings */}
          {form.provider === 'mailgun' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Mailgun Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderSecretInput('API Key', 'mailgunApiKey', 'key-xxxxxx')}
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={form.mailgunDomain || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, mailgunDomain: e.target.value }))}
                    placeholder="mg.yourdomain.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AWS SES Settings */}
          {form.provider === 'ses' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">AWS SES Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderSecretInput('Access Key ID', 'sesAccessKeyId', 'AKIAXXXXXXXX')}
                {renderSecretInput('Secret Access Key', 'sesSecretAccessKey', 'xxxxxx')}
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={form.sesRegion || 'us-east-1'}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, sesRegion: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                      <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                      <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables Status */}
      {envVars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Environment Variables</CardTitle>
            <CardDescription>
              Settings configured in the database take precedence over environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {envVars.map((envVar) => (
                <div key={envVar.name} className="flex items-center gap-2 text-sm">
                  {envVar.configured ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground/30" />
                  )}
                  <span className={envVar.configured ? '' : 'text-muted-foreground'}>
                    {envVar.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={sendTestEmail}
          disabled={testing || !form.fromEmail}
        >
          {testing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Test Email
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
