'use client';

/**
 * Plugin UI Editor Page
 *
 * Visual editor for creating plugin settings pages and dashboard widgets using Puck
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Puck, type Data } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { ArrowLeft, Save, Eye, Layout, Settings, Monitor } from 'lucide-react';
import { pluginUIPuckConfig, type PluginUIComponents } from '../../../../../puck/plugin';

interface PageProps {
  params: Promise<{ pluginId: string }>;
}

type UIType = 'settings' | 'widget' | 'page';

const uiTypeLabels: Record<UIType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  settings: { label: 'Settings Page', icon: Settings },
  widget: { label: 'Dashboard Widget', icon: Layout },
  page: { label: 'Custom Page', icon: Monitor },
};

export default function PluginUIEditorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [plugin, setPlugin] = useState<{ id: string; name: string } | null>(null);
  const [uiType, setUIType] = useState<UIType>('settings');
  const [data, setData] = useState<Data<PluginUIComponents>>({
    content: [],
    root: { props: {} },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch plugin info and existing UI
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch plugin info
        const pluginRes = await fetch(`/api/plugins/${resolvedParams.pluginId}`);
        if (pluginRes.ok) {
          const pluginData = await pluginRes.json();
          setPlugin(pluginData.plugin);
        }

        // Fetch existing UI data if any
        const uiRes = await fetch(
          `/api/plugins/${resolvedParams.pluginId}/ui?type=${uiType}`
        );
        if (uiRes.ok) {
          const uiData = await uiRes.json();
          if (uiData.ui?.data) {
            setData(uiData.ui.data);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.pluginId, uiType]);

  const handleSave = async (puckData: Data<PluginUIComponents>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/plugins/${resolvedParams.pluginId}/ui`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: uiType,
          data: puckData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save UI');
      }

      setData(puckData);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save UI');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/plugins"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {plugin?.name || 'Plugin'} UI Editor
            </h1>
            <p className="text-xs text-gray-500">
              Building: {uiTypeLabels[uiType].label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* UI Type Selector */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(Object.entries(uiTypeLabels) as [UIType, typeof uiTypeLabels[UIType]][]).map(
              ([type, { label, icon: Icon }]) => (
                <button
                  key={type}
                  onClick={() => setUIType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    uiType === type
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            )}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          <Link
            href={`/plugins/${resolvedParams.pluginId}/ui/preview?type=${uiType}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Link>

          {isSaving && (
            <span className="text-sm text-blue-600">Saving...</span>
          )}
        </div>
      </div>

      {/* Puck Editor */}
      <div className="flex-1 min-h-0">
        <Puck
          config={pluginUIPuckConfig}
          data={data}
          onPublish={handleSave}
          headerTitle={`${plugin?.name || 'Plugin'} - ${uiTypeLabels[uiType].label}`}
        />
      </div>
    </div>
  );
}
