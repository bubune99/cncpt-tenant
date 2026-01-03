'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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
);

// Import Puck styles
import '@measured/puck/puck.css';

// Import layout Puck configuration
import { layoutPuckConfig } from '../../../../../puck/layout/config';
import type { Data } from '@measured/puck';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);

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

      // If header data exists, wrap it in Puck data structure
      if (data.header) {
        // Check if it's already in Puck format (has content array)
        if (data.header.content && Array.isArray(data.header.content)) {
          setPuckData(data.header);
        } else {
          // Legacy format - wrap the header config in Puck structure
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
        // No header data - use default
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
        body: JSON.stringify({
          header: data,
        }),
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
          <Link href="/admin/pages/layout">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Layout Settings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/pages/layout">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Header Editor</h1>
            <p className="text-xs text-muted-foreground">
              Configure your site&apos;s navigation header
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/pages/layout">
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      {/* Puck Editor */}
      <div className="flex-1 overflow-hidden">
        <Puck
          config={layoutPuckConfig}
          data={puckData}
          onPublish={handleSave}
          headerTitle=""
          headerPath=""
        />
      </div>
    </div>
  );
}
