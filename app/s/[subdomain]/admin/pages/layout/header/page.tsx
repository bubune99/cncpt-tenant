'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/cms/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { Puck, Data, Drawer } from '@puckeditor/core';
import '@puckeditor/core/puck.css';

// Import custom Puck AI plugin
import { aiChatPlugin } from '@/puck/plugins/aiChatPlugin';

// Import editor components
import { EditorContextMenu } from '@/puck/components/EditorContextMenu';
import { DraggableOutline } from '@/puck/components/DraggableOutline';
import { HelpModeButton } from '@/puck/components/HelpModeButton';
import { HelpModeProvider } from '@/lib/cms/puck/help-mode-context';

// Import layout Puck configuration
import { layoutPuckConfig } from '@/puck/layout/config';

// Use custom AI chat plugin
const puckPlugins = [aiChatPlugin];

// Component preview SVG icons for layout components
const componentPreviews: Record<string, React.ReactNode> = {
  Header: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="6" width="44" height="16" rx="1" fill="#ffffff" stroke="#0ea5e9" />
      <rect x="6" y="10" width="10" height="5" rx="1" fill="#0ea5e9" />
      <rect x="18" y="11" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="25" y="11" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="32" y="11" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="40" y="10" width="4" height="5" rx="1" fill="#0ea5e9" />
    </svg>
  ),
  Footer: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#1e293b" />
      <rect x="6" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="6" y="10" width="6" height="2" rx="1" fill="#475569" />
      <rect x="18" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="18" y="10" width="6" height="2" rx="1" fill="#475569" />
      <rect x="30" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="30" y="10" width="6" height="2" rx="1" fill="#475569" />
      <line x1="6" y1="18" x2="42" y2="18" stroke="#475569" />
      <rect x="18" y="21" width="12" height="2" rx="1" fill="#475569" />
    </svg>
  ),
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
        <h3 className="section-title">Layout Components</h3>
        <Drawer>
          {['Header', 'Footer', 'AnnouncementBar'].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name}</span>
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

// Default header data structure for Puck
const defaultHeaderData: Data = {
  root: { props: {} },
  content: [
    {
      type: 'Header',
      props: {
        id: 'header-1',
        logo: { type: 'text', text: 'Your Brand' },
        navLinks: [
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
        showSearch: true,
        showCart: true,
        showAccount: false,
        sticky: true,
        transparent: false,
        backgroundColor: '#ffffff',
        textColor: '#18181b',
        maxWidth: 'xl',
      },
    },
  ],
  zones: {},
};

export default function HeaderEditorPage() {
  const { buildPath } = useCMSConfig();
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
    fetchHeaderSettings();
  }, []);

  const fetchHeaderSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/site-settings/header');

      if (!response.ok) {
        throw new Error('Failed to fetch header settings');
      }

      const data = await response.json();

      if (data.header) {
        if (data.header.content && Array.isArray(data.header.content)) {
          setPuckData(data.header);
        } else {
          setPuckData({
            root: { props: {} },
            content: [
              {
                type: 'Header',
                props: { id: 'header-1', ...data.header },
              },
            ],
            zones: {},
          });
        }
      } else {
        setPuckData(defaultHeaderData);
      }
    } catch (error) {
      console.error('Error fetching header settings:', error);
      setError('Failed to load header settings');
      toast.error('Failed to load header settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Data) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/site-settings/header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header: data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save header settings');
      }

      toast.success('Header saved successfully');
      setPuckData(data);
    } catch (error) {
      console.error('Error saving header:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save header');
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
          Unable to load header settings. Please try again.
        </p>
        <Button asChild>
          <Link href={buildPath('/admin/pages/layout')}>
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
            <Link href={buildPath('/admin/pages/layout')} className="puck-back-link">
              <ArrowLeft className="h-4 w-4" />
              <span>Layout</span>
            </Link>
            <span className="puck-header-divider">/</span>
            <span className="puck-page-title">Header Editor</span>
          </div>
          <div className="puck-app-header-right">
            <span className="puck-page-subtitle">Site Navigation</span>
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
          color: #0ea5e9;
          border-bottom-color: #0ea5e9;
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
          border-color: #0ea5e9;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.15);
        }

        .component-preview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f9ff;
          padding: 8px;
          border-bottom: 1px solid #e0f2fe;
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
