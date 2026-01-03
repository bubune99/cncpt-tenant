'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { layoutPuckConfig } from '@/puck/layout/config';
import type { Data } from '@measured/puck';

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

export default function AnnouncementEditorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);

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
            <h1 className="font-semibold">Announcement Bar Editor</h1>
            <p className="text-xs text-muted-foreground">
              Configure the top banner for promotions and alerts
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
