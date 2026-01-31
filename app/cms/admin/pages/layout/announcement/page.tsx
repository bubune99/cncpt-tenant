'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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
);

// Import Puck styles
import '@puckeditor/core/puck.css';

// Import custom Puck AI plugin
import { aiChatPlugin } from '@/puck/plugins/aiChatPlugin';

// Import editor components
import { EditorContextMenu } from '@/puck/components/EditorContextMenu';
import { DraggableOutline } from '@/puck/components/DraggableOutline';
import { HelpModeButton } from '@/puck/components/HelpModeButton';
import { HelpModeProvider } from '@/lib/cms/puck/help-mode-context';
import { Drawer } from '@puckeditor/core';

// Import layout Puck configuration
import { layoutPuckConfig } from '../../../../../puck/layout/config';
import type { Data } from '@puckeditor/core';

// Use custom AI chat plugin
const puckPlugins = [aiChatPlugin];

// Default announcement bar data structure for Puck
const defaultAnnouncementData: Data = {
  root: { props: {} },
  content: [
    {
      type: 'AnnouncementBar',
      props: {
        id: 'announcement-1',
        message: 'Free shipping on orders over $50!',
        link: {
          label: 'Shop Now',
          href: '/products',
        },
        dismissible: true,
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
      },
    },
  ],
  zones: {},
};

// Component preview SVG icons
const componentPreviews: Record<string, React.ReactNode> = {
  AnnouncementBar: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="10" width="44" height="8" rx="1" fill="#3b82f6" />
      <rect x="10" y="12" width="28" height="4" rx="1" fill="#ffffff" opacity="0.8" />
    </svg>
  ),
};

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
  );
}

// Component list with custom previews using Drawer
function ComponentListWithPreviews() {
  return (
    <div className="component-list-with-previews">
      <div className="component-section">
        <h3 className="section-title">Announcement Components</h3>
        <Drawer>
          {['AnnouncementBar'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>
    </div>
  );
}

export default function AnnouncementEditorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);
  const [activeTab, setActiveTab] = useState<'components' | 'outline'>('components');

  // Memoize overrides - MUST be before any early returns
  const puckOverrides = useMemo(() => ({
    puck: ({ children }: { children: React.ReactNode }) => (
      <>
        {children}
        <EditorContextMenu />
      </>
    ),
    headerActions: ({ children }: { children: React.ReactNode }) => (
      <>
        <HelpModeButton />
        {children}
      </>
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
          <ComponentListWithPreviews />
        )}
      </div>
    ),
  }), [activeTab]);

  useEffect(() => {
    fetchAnnouncementSettings();
  }, []);

  const fetchAnnouncementSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/site-settings/announcement');

      if (!response.ok) {
        throw new Error('Failed to fetch announcement settings');
      }

      const data = await response.json();

      // If announcement data exists, wrap it in Puck data structure
      if (data.announcementBar) {
        // Check if it's already in Puck format (has content array)
        if (data.announcementBar.content && Array.isArray(data.announcementBar.content)) {
          setPuckData(data.announcementBar);
        } else {
          // Legacy format - wrap the announcement config in Puck structure
          setPuckData({
            root: { props: {} },
            content: [
              {
                type: 'AnnouncementBar',
                props: { id: 'announcement-1', ...data.announcementBar },
              },
            ],
            zones: {},
          });
        }
      } else {
        // No announcement data - use default
        setPuckData(defaultAnnouncementData);
      }
    } catch (error) {
      console.error('Error fetching announcement settings:', error);
      setError('Failed to load announcement settings');
      toast.error('Failed to load announcement settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Data) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/site-settings/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementBar: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save announcement settings');
      }

      toast.success('Announcement bar saved successfully');
      setPuckData(data);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save announcement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !puckData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error || 'Failed to load'}</h2>
        <p className="text-muted-foreground mb-4">
          Unable to load announcement settings. Please try again.
        </p>
        <Button asChild>
          <Link href="/admin/pages/layout">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Layout Settings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <HelpModeProvider>
      <div className="puck-editor-wrapper">
        {/* Application Header */}
        <div className="puck-app-header">
          <div className="puck-app-header-left">
            <Link href="/admin/pages/layout" className="puck-back-link">
              <ArrowLeft className="h-4 w-4" />
              <span>Layout</span>
            </Link>
            <span className="puck-header-divider">/</span>
            <span className="puck-page-title">Announcement Bar</span>
          </div>
          <div className="puck-app-header-right">
            <span className="puck-page-subtitle">Promotions &amp; Alerts</span>
          </div>
        </div>

        {/* Puck Editor */}
        <div className="puck-editor-container">
          <Puck
          config={layoutPuckConfig}
          data={puckData}
          onPublish={handleSave}
          plugins={puckPlugins}
          overrides={puckOverrides}
          headerTitle=""
          headerPath=""
        />
        </div>

      <style>{`
        .puck-editor-wrapper {
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .puck-app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 44px;
          padding: 0 16px;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .puck-app-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .puck-app-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .puck-back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .puck-back-link:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .puck-header-divider {
          color: #d1d5db;
          font-size: 14px;
        }

        .puck-page-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .puck-page-subtitle {
          font-size: 12px;
          color: #9ca3af;
        }

        .puck-editor-container {
          flex: 1;
          overflow: hidden;
        }

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
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: #ffffff;
        }

        /* Component list styling */
        .component-list-with-previews {
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
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .component-preview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          padding: 8px;
          border-bottom: 1px solid #dbeafe;
        }

        .component-card-info {
          padding: 8px 10px;
        }

        .component-card-name {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }
        `}</style>
      </div>
    </HelpModeProvider>
  );
}
