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

// Default footer data structure for Puck
const defaultFooterData: Data = {
  root: { props: {} },
  content: [
    {
      type: 'Footer',
      props: {
        id: 'footer-1',
        logo: { type: 'text', text: 'Your Brand' },
        tagline: 'Building amazing products for our customers.',
        columns: [
          {
            title: 'Products',
            links: [
              { label: 'Features', href: '/features' },
              { label: 'Pricing', href: '/pricing' },
              { label: 'Integrations', href: '/integrations' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About', href: '/about' },
              { label: 'Careers', href: '/careers' },
              { label: 'Contact', href: '/contact' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
          { platform: 'linkedin', url: 'https://linkedin.com' },
        ],
        newsletter: {
          enabled: true,
          title: 'Stay Updated',
          description: 'Subscribe to our newsletter for the latest updates.',
          placeholder: 'Enter your email',
          buttonLabel: 'Subscribe',
        },
        bottomLinks: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
        backgroundColor: '#18181b',
        textColor: '#ffffff',
        maxWidth: 'xl',
        layout: 'columns',
      },
    },
  ],
  zones: {},
};

export default function FooterEditorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/site-settings/footer');

      if (!response.ok) {
        throw new Error('Failed to fetch footer settings');
      }

      const data = await response.json();

      // If footer data exists, wrap it in Puck data structure
      if (data.footer) {
        // Check if it's already in Puck format (has content array)
        if (data.footer.content && Array.isArray(data.footer.content)) {
          setPuckData(data.footer);
        } else {
          // Legacy format - wrap the footer config in Puck structure
          setPuckData({
            root: { props: {} },
            content: [
              {
                type: 'Footer',
                props: { id: 'footer-1', ...data.footer },
              },
            ],
            zones: {},
          });
        }
      } else {
        // No footer data - use default
        setPuckData(defaultFooterData);
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      setError('Failed to load footer settings');
      toast.error('Failed to load footer settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Data) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/site-settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          footer: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save footer settings');
      }

      toast.success('Footer saved successfully');
      setPuckData(data);
    } catch (error) {
      console.error('Error saving footer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save footer');
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
          Unable to load footer settings. Please try again.
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
            <h1 className="font-semibold">Footer Editor</h1>
            <p className="text-xs text-muted-foreground">
              Configure your site&apos;s footer section
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
