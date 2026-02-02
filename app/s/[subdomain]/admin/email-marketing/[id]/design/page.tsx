'use client'

/**
 * Email Template Designer (Puck Editor)
 *
 * Visual email template editor using Puck with AI assistance
 */

import { useState, useEffect, use, useMemo } from 'react'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/cms/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { useCMSConfig } from '@/contexts/CMSConfigContext'
import dynamic from 'next/dynamic'

// Dynamically import Puck to avoid SSR issues
const Puck = dynamic(
  () => import('@puckeditor/core').then((mod) => mod.Puck),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

// Import Drawer for component list
import { Drawer } from '@puckeditor/core'

// Import Puck styles
import '@puckeditor/core/puck.css'

// Import custom Puck AI plugin
import { aiChatPlugin } from '@/puck/plugins/aiChatPlugin'

// Import editor components
import { EditorContextMenu } from '@/puck/components/EditorContextMenu'
import { DraggableOutline } from '@/puck/components/DraggableOutline'
import { HelpModeButton } from '@/puck/components/HelpModeButton'
import { HelpModeProvider } from '@/lib/cms/puck/help-mode-context'

// Use custom AI chat plugin
const puckPlugins = [aiChatPlugin]

// Import the email Puck configuration
import { emailPuckConfig } from '@/puck/email/config'
import type { Data } from '@puckeditor/core'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: string
  content: Data | null
}

// Email component preview SVG thumbnails
const componentPreviews: Record<string, React.ReactNode> = {
  // Structure
  EmailContainer: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="2" width="40" height="24" rx="2" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="8" y="6" width="32" height="4" rx="1" fill="#e2e8f0" />
      <rect x="8" y="12" width="32" height="4" rx="1" fill="#e2e8f0" />
      <rect x="8" y="18" width="32" height="4" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  EmailHeader: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="4" width="44" height="20" rx="2" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
      <rect x="14" y="10" width="20" height="8" rx="1" fill="#22c55e" />
      <rect x="17" y="13" width="14" height="3" rx="1" fill="#ffffff" />
    </svg>
  ),
  EmailDivider: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="6" width="40" height="5" rx="1" fill="#e2e8f0" />
      <line x1="8" y1="14" x2="40" y2="14" stroke="#d1d5db" strokeWidth="2" />
      <rect x="4" y="17" width="40" height="5" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  EmailSpacer: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="4" rx="1" fill="#e2e8f0" />
      <line x1="24" y1="10" x2="24" y2="18" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M20 10 L24 7 L28 10" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <path d="M20 18 L24 21 L28 18" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <rect x="4" y="20" width="40" height="4" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  EmailColumns: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="3" y="3" width="20" height="22" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="25" y="3" width="20" height="22" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="6" y="7" width="14" height="3" rx="1" fill="#93c5fd" />
      <rect x="28" y="7" width="14" height="3" rx="1" fill="#93c5fd" />
      <rect x="6" y="12" width="14" height="3" rx="1" fill="#93c5fd" />
      <rect x="28" y="12" width="14" height="3" rx="1" fill="#93c5fd" />
    </svg>
  ),
  EmailFooter: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="2" fill="#f3f4f6" />
      <rect x="14" y="6" width="20" height="2" rx="1" fill="#9ca3af" />
      <line x1="6" y1="12" x2="42" y2="12" stroke="#d1d5db" />
      <rect x="6" y="16" width="36" height="2" rx="1" fill="#9ca3af" />
      <rect x="10" y="20" width="28" height="2" rx="1" fill="#9ca3af" />
    </svg>
  ),
  // Content
  EmailText: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="20" rx="1" fill="#f9fafb" />
      <rect x="8" y="8" width="32" height="2" rx="1" fill="#6b7280" />
      <rect x="8" y="12" width="28" height="2" rx="1" fill="#6b7280" />
      <rect x="8" y="16" width="32" height="2" rx="1" fill="#6b7280" />
      <rect x="8" y="20" width="20" height="2" rx="1" fill="#6b7280" />
    </svg>
  ),
  EmailImage: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="2" width="40" height="24" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
      <circle cx="14" cy="10" r="3" fill="#94a3b8" />
      <path d="M4 22 L16 14 L26 20 L34 12 L44 18 V24 C44 25.1 43.1 26 42 26 H6 C4.9 26 4 25.1 4 24 V22Z" fill="#cbd5e1" />
    </svg>
  ),
  EmailList: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <circle cx="8" cy="8" r="2" fill="#3b82f6" />
      <rect x="14" y="6" width="28" height="3" rx="1" fill="#94a3b8" />
      <circle cx="8" cy="14" r="2" fill="#3b82f6" />
      <rect x="14" y="12" width="28" height="3" rx="1" fill="#94a3b8" />
      <circle cx="8" cy="20" r="2" fill="#3b82f6" />
      <rect x="14" y="18" width="28" height="3" rx="1" fill="#94a3b8" />
    </svg>
  ),
  // Hero & Cards
  EmailHero: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="10" y="6" width="28" height="4" rx="1" fill="#3b82f6" />
      <rect x="12" y="12" width="24" height="2" rx="1" fill="#93c5fd" />
      <rect x="14" y="16" width="20" height="2" rx="1" fill="#93c5fd" />
      <rect x="16" y="21" width="16" height="4" rx="2" fill="#3b82f6" />
    </svg>
  ),
  EmailCard: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="2" width="40" height="24" rx="3" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="4" y="2" width="40" height="10" rx="3" fill="#f1f5f9" />
      <rect x="8" y="14" width="20" height="2" rx="1" fill="#374151" />
      <rect x="8" y="18" width="32" height="2" rx="1" fill="#94a3b8" />
      <rect x="8" y="22" width="24" height="2" rx="1" fill="#94a3b8" />
    </svg>
  ),
  // Actions
  EmailButton: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="6" y="6" width="36" height="16" rx="4" fill="#3b82f6" />
      <rect x="14" y="12" width="20" height="4" rx="1" fill="#ffffff" />
    </svg>
  ),
  // E-commerce
  EmailProduct: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="16" height="24" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
      <rect x="20" y="4" width="24" height="3" rx="1" fill="#374151" />
      <rect x="20" y="9" width="20" height="2" rx="1" fill="#9ca3af" />
      <rect x="20" y="13" width="12" height="3" rx="1" fill="#22c55e" />
      <rect x="20" y="20" width="16" height="5" rx="2" fill="#3b82f6" />
    </svg>
  ),
  EmailCoupon: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="4" width="44" height="20" rx="2" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
      <rect x="10" y="8" width="28" height="4" rx="1" fill="#f59e0b" />
      <rect x="14" y="14" width="20" height="6" rx="1" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" />
      <text x="24" y="19" textAnchor="middle" fontSize="6" fill="#f59e0b" fontWeight="bold">CODE</text>
    </svg>
  ),
}

// Component preview renderer
function ComponentPreview({ name }: { name: string }) {
  return (
    <div className="component-preview-icon">
      {componentPreviews[name] || (
        <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
          <rect x="4" y="4" width="40" height="20" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
        </svg>
      )}
    </div>
  )
}

// Email component list with previews using Drawer
function EmailComponentListWithPreviews() {
  return (
    <div className="email-component-list">
      <div className="component-section">
        <h3 className="section-title">Structure</h3>
        <Drawer>
          {['EmailContainer', 'EmailHeader', 'EmailDivider', 'EmailSpacer', 'EmailColumns', 'EmailFooter'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name.replace('Email', '')}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Content</h3>
        <Drawer>
          {['EmailText', 'EmailImage', 'EmailList'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name.replace('Email', '')}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Hero & Cards</h3>
        <Drawer>
          {['EmailHero', 'EmailCard'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card hero-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name.replace('Email', '')}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Actions</h3>
        <Drawer>
          {['EmailButton'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card action-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name.replace('Email', '')}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">E-commerce</h3>
        <Drawer>
          {['EmailProduct', 'EmailCoupon'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card ecommerce-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name.replace('Email', '')}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>
    </div>
  )
}

export default function EmailDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { buildPath } = useCMSConfig()
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [puckData, setPuckData] = useState<Data | null>(null)
  const [activeTab, setActiveTab] = useState<'components' | 'outline'>('components')

  // Memoize overrides - MUST be before any early returns
  const puckOverrides = useMemo(() => ({
    puck: ({ children }: { children: React.ReactNode }) => (
      <>
        {children}
        <EditorContextMenu />
      </>
    ),
    // Custom header with help mode and back button
    headerActions: ({ children }: { children: React.ReactNode }) => (
      <div className="flex items-center gap-2">
        <HelpModeButton />
        {children}
        <Link href={buildPath(`/admin/email-marketing/${id}`)}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>
      </div>
    ),
    drawer: () => (
      <div className="custom-sidebar">
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
          >
            Components
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'outline' ? 'active' : ''}`}
            onClick={() => setActiveTab('outline')}
          >
            Outline
          </button>
        </div>
        {activeTab === 'outline' ? (
          <DraggableOutline />
        ) : (
          <EmailComponentListWithPreviews />
        )}
      </div>
    ),
  }), [activeTab, id])

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
          <Link href={buildPath('/admin/email-marketing')}>
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
    <HelpModeProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Puck Editor - full height, no custom header (use Puck's header) */}
        <div className="flex-1 overflow-hidden email-designer-container">
          <Puck
            config={emailPuckConfig}
            data={puckData}
            onPublish={handleSave}
            plugins={puckPlugins}
            overrides={puckOverrides}
            headerTitle={campaign.name}
            headerPath={`← Back to ${campaign.subject || 'Email Settings'}`}
          />
        </div>

        <style>{`
        /* Custom sidebar styling */
        .custom-sidebar {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa;
        }

        .sidebar-tab {
          flex: 1;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 2px solid transparent;
        }

        .sidebar-tab:hover {
          color: #1a1a1a;
          background: #f3f4f6;
        }

        .sidebar-tab.active {
          color: #f59e0b;
          border-bottom-color: #f59e0b;
          background: #ffffff;
        }

        /* Email component list styling */
        .email-component-list {
          padding: 12px;
          overflow-y: auto;
          height: 100%;
        }

        .component-section {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }

        .component-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          cursor: grab;
          transition: all 0.15s ease;
          margin-bottom: 6px;
        }

        .component-card:hover {
          border-color: #f59e0b;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
        }

        .component-card:active {
          cursor: grabbing;
        }

        .component-preview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fffbeb;
          padding: 8px;
          border-bottom: 1px solid #fef3c7;
        }

        .component-card-info {
          padding: 8px 10px;
        }

        .component-card-name {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        /* Hero card styling */
        .hero-card {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }

        .hero-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .hero-card .component-preview-icon {
          background: #dbeafe;
          border-bottom-color: #bfdbfe;
        }

        /* Action card styling */
        .action-card {
          border-color: #a5f3fc;
          background: linear-gradient(135deg, #f0fdff 0%, #e0f7ff 100%);
        }

        .action-card:hover {
          border-color: #0ea5e9;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
        }

        .action-card .component-preview-icon {
          background: #e0f2fe;
          border-bottom-color: #bae6fd;
        }

        /* E-commerce card styling */
        .ecommerce-card {
          border-color: #bbf7d0;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .ecommerce-card:hover {
          border-color: #22c55e;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
        }

        .ecommerce-card .component-preview-icon {
          background: #dcfce7;
          border-bottom-color: #bbf7d0;
        }

        /* Email editor specific styling */
        [data-puck-dropzone]:empty {
          min-height: 60px;
          border: 2px dashed #fcd34d;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fffbeb;
        }

        [data-puck-dropzone]:empty::before {
          content: "Drop email components here";
          color: #d97706;
          font-size: 14px;
        }

        /* Fix Puck editor height to fit viewport */
        .email-designer-container {
          height: 100vh;
          max-height: 100vh;
        }

        .email-designer-container [class*="Puck-"] {
          height: 100%;
          max-height: 100%;
        }

        /* Ensure AI chat panel fits within viewport */
        .ai-chat-panel {
          max-height: calc(100vh - 60px) !important;
          overflow: hidden;
        }

        .ai-chat-panel .ai-chat-messages {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        /* Fix plugin rail positioning */
        [class*="PuckLayout-rightSideBar"] {
          height: calc(100vh - 53px);
          max-height: calc(100vh - 53px);
          overflow: hidden;
        }
        `}</style>
      </div>
    </HelpModeProvider>
  )
}
