'use client'

/**
 * Email Template Designer (Puck Editor)
 *
 * Visual email template editor using Puck
 */

import { useState, useEffect, use } from 'react'
import { ArrowLeft, Loader2, AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import Puck to avoid SSR issues
const Puck = dynamic(
  () => import('@measured/puck').then((mod) => mod.Puck),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

// Import Puck styles
import '@measured/puck/puck.css'

// Import Puck AI plugin
import { createAiPlugin } from '@puckeditor/plugin-ai'
import '@puckeditor/plugin-ai/styles.css'

// Create the AI plugin instance
const aiPlugin = createAiPlugin()

// Import the email Puck configuration
import { emailPuckConfig } from '@/puck/email/config'
import type { Data } from '@measured/puck'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: string
  content: Data | null
}

export default function EmailDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [puckData, setPuckData] = useState<Data | null>(null)

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/emails/campaigns/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Campaign not found')
          return
        }
        throw new Error('Failed to fetch campaign')
      }

      const responseData = await response.json()
      // API returns { success: true, campaign: {...} }
      const campaignData = responseData.campaign || responseData
      setCampaign(campaignData)

      // Initialize Puck data from saved content or create empty structure
      setPuckData(
        campaignData.content || {
          root: { props: {} },
          content: [],
          zones: {},
        }
      )
    } catch (error) {
      console.error('Error fetching campaign:', error)
      setError('Failed to load campaign')
      toast.error('Failed to load campaign')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: Data) => {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/emails/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save email template')
      }

      toast.success('Email template saved successfully')
      setPuckData(data)
    } catch (error) {
      console.error('Error saving email template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save email template')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error || 'Campaign not found'}</h2>
        <p className="text-muted-foreground mb-4">
          The campaign you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
        </p>
        <Button asChild>
          <Link href="/admin/email-marketing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Email Marketing
          </Link>
        </Button>
      </div>
    )
  }

  if (!puckData) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/email-marketing/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{campaign.name}</h1>
            <p className="text-xs text-muted-foreground">
              Email Designer (Puck) • {campaign.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/email-marketing/${id}`}>
              Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Puck Editor */}
      <div className="flex-1 overflow-hidden">
        <Puck
          config={emailPuckConfig}
          data={puckData}
          onPublish={handleSave}
          plugins={[aiPlugin]}
          headerTitle=""
          headerPath=""
        />
      </div>
    </div>
  )
}
