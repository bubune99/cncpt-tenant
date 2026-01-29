'use client';

/**
 * Plugin UI Preview Page
 *
 * Renders the plugin UI built with Puck
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Render } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { ArrowLeft, Edit } from 'lucide-react';
import { pluginUIPuckConfig, type PluginUIComponents } from '../../../../../../puck/plugin';
import type { Data } from '@puckeditor/core';

interface PageProps {
  params: Promise<{ pluginId: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default function PluginUIPreviewPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const uiType = resolvedSearchParams.type || 'settings';

  const [plugin, setPlugin] = useState<{ id: string; name: string } | null>(null);
  const [data, setData] = useState<Data<PluginUIComponents> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch plugin info
        const pluginRes = await fetch(`/api/plugins/${resolvedParams.pluginId}`);
        if (pluginRes.ok) {
          const pluginData = await pluginRes.json();
          setPlugin(pluginData.plugin);
        }

        // Fetch UI data
        const uiRes = await fetch(
          `/api/plugins/${resolvedParams.pluginId}/ui?type=${uiType}`
        );
        if (uiRes.ok) {
          const uiData = await uiRes.json();
          if (uiData.ui?.data) {
            setData(uiData.ui.data);
          } else {
            setError('No UI configured for this plugin');
          }
        } else {
          setError('Failed to load UI data');
        }
      } catch (err) {
        console.error('Failed to load:', err);
        setError('Failed to load plugin UI');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.pluginId, uiType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/plugins/${resolvedParams.pluginId}/ui`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {plugin?.name || 'Plugin'} Preview
              </h1>
              <p className="text-xs text-gray-500 capitalize">{uiType} View</p>
            </div>
          </div>

          <Link
            href={`/plugins/${resolvedParams.pluginId}/ui`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">{error}</p>
            <Link
              href={`/plugins/${resolvedParams.pluginId}/ui`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Create UI
            </Link>
          </div>
        ) : data ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <Render config={pluginUIPuckConfig} data={data} />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No content to preview</p>
          </div>
        )}
      </div>

      {/* View Switcher */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 shadow-lg p-1">
          {['settings', 'widget', 'page'].map((type) => (
            <Link
              key={type}
              href={`/plugins/${resolvedParams.pluginId}/ui/preview?type=${type}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                uiType === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
