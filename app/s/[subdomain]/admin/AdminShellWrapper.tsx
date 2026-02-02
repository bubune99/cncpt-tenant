'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AdminShell } from './AdminShell';
import { isDemoSubdomain, DEMO_CONFIG } from '@/lib/demo';

interface CMSFeatures {
  blog: boolean;
  pages: boolean;
  media: boolean;
  analytics: boolean;
  forms: boolean;
  multiLanguage: boolean;
  scheduling: boolean;
  ecommerce: {
    enabled: boolean;
    products: boolean;
    orders: boolean;
    customers: boolean;
    shipping: boolean;
    inventory: boolean;
    reviews: boolean;
    discounts: boolean;
  };
  email: {
    enabled: boolean;
    marketing: boolean;
    transactional: boolean;
  };
  ai: {
    enabled: boolean;
    chatbot: boolean;
    contentGeneration: boolean;
  };
  plugins: boolean;
  workflows: boolean;
}

interface FeaturesResponse {
  features: CMSFeatures;
  hiddenNavItems: string[];
  subdomain: string;
}

/**
 * Get hidden navigation items based on feature configuration
 */
function getHiddenItems(features: CMSFeatures): string[] {
  const hidden: string[] = [];

  // Core features
  if (!features.blog) hidden.push('Blog');
  if (!features.pages) hidden.push('Pages');
  if (!features.media) hidden.push('Media');
  if (!features.analytics) hidden.push('Analytics');
  if (!features.forms) hidden.push('Forms');

  // E-commerce
  if (!features.ecommerce?.enabled) {
    hidden.push('Products', 'Orders', 'Order Workflows', 'Shipping', 'Customers');
  } else {
    if (!features.ecommerce.products) hidden.push('Products');
    if (!features.ecommerce.orders) hidden.push('Orders', 'Order Workflows');
    if (!features.ecommerce.customers) hidden.push('Customers');
    if (!features.ecommerce.shipping) hidden.push('Shipping');
  }

  // Email
  if (!features.email?.enabled) {
    hidden.push('Email Marketing');
  }

  // Advanced
  if (!features.plugins) hidden.push('Plugins');
  if (!features.workflows) hidden.push('Workflows');

  return hidden;
}

export function AdminShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const subdomain = params?.subdomain as string;
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if this is demo mode
  const isDemo = isDemoSubdomain(subdomain);

  useEffect(() => {
    async function loadFeatures() {
      if (!subdomain) {
        setLoading(false);
        return;
      }

      // For demo mode, enable all features
      if (isDemo) {
        setHiddenItems([]);
        setShowChat(true);
        setLoading(false);
        return;
      }

      try {
        // First try the main API
        const res = await fetch(`/api/cms/features/${subdomain}`);
        if (res.ok) {
          const data: FeaturesResponse = await res.json();
          const hidden = getHiddenItems(data.features);
          setHiddenItems(hidden);
          setShowChat(data.features.ai?.enabled && data.features.ai?.chatbot);
        }
      } catch (error) {
        console.error('[AdminShellWrapper] Failed to load features:', error);
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }

    loadFeatures();
  }, [subdomain, isDemo]);

  // Build config
  const config = {
    basePath: `/s/${subdomain}`,
    siteUrl: `/${subdomain}`,
    siteName: isDemo ? DEMO_CONFIG.siteName : subdomain,
    hiddenItems,
    showChat,
    isDemo,
  };

  // Show loading spinner while fetching features
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading admin...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell config={config}>
      {children}
    </AdminShell>
  );
}
