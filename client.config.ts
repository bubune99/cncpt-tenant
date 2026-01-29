/**
 * Client Configuration
 *
 * This file contains all client-specific settings. Modify this file to customize
 * the CMS for your needs. This file is SAFE to edit and won't conflict with
 * upstream updates.
 *
 * After forking, this is your main configuration file.
 */

import type { ComponentConfig } from '@puckeditor/core';
import { clientTheme } from '@/client/theme';

// =============================================================================
// BRANDING
// =============================================================================

export const branding = {
  // Site identity
  siteName: 'My Site',
  siteDescription: 'A Next.js CMS powered site',
  logo: {
    light: '/logo.svg',        // Logo for light mode
    dark: '/logo-dark.svg',    // Logo for dark mode
    width: 120,
    height: 40,
  },

  // Favicon
  favicon: '/favicon.ico',

  // Social/SEO defaults
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@mysite',
};

// =============================================================================
// FEATURES
// =============================================================================

export const features = {
  // Core modules
  blog: true,
  shop: true,
  pages: true,
  forms: true,
  media: true,

  // E-commerce features
  ecommerce: {
    enabled: true,
    checkout: true,
    subscriptions: false,
    digitalProducts: false,
    inventory: true,
  },

  // Communication
  email: {
    enabled: true,
    marketing: true,
    transactional: true,
  },

  // AI features
  ai: {
    enabled: true,
    chatbot: false,
    contentGeneration: true,
    imageGeneration: false,
  },

  // Advanced
  analytics: false,
  multiLanguage: false,
  scheduling: false,
};

// =============================================================================
// PUCK EDITOR
// =============================================================================

export const puckConfig = {
  // Custom components to add to the editor
  // Import from @/client/components and add configs here
  customComponents: {} as Record<string, ComponentConfig>,

  // Components to hide from the editor
  hiddenComponents: [] as string[],

  // Default component category for custom components
  customComponentCategory: 'Custom',

  // AI assistant settings
  ai: {
    enabled: true,
    model: 'claude' as 'claude' | 'gpt-4' | 'gpt-3.5',
  },
};

// =============================================================================
// THEME
// =============================================================================

export const theme = {
  ...clientTheme,

  // Dark mode
  darkMode: {
    enabled: true,
    default: 'system' as 'light' | 'dark' | 'system',
  },
};

// =============================================================================
// INTEGRATIONS
// =============================================================================

export const integrations = {
  // Payment
  stripe: {
    enabled: true,
    // Keys are in .env.local
  },

  // Email
  email: {
    provider: 'nodemailer' as 'nodemailer' | 'resend' | 'sendgrid',
  },

  // Storage
  storage: {
    provider: 's3' as 's3' | 'cloudflare' | 'local',
  },

  // Authentication
  auth: {
    provider: 'stack' as 'stack' | 'nextauth' | 'clerk',
    allowRegistration: true,
    requireEmailVerification: true,
  },
};

// =============================================================================
// ADMIN
// =============================================================================

export const admin = {
  // Admin panel settings
  title: 'Admin Dashboard',

  // Sidebar navigation customization
  navigation: {
    // Hide specific menu items
    hidden: [] as string[],

    // Add custom menu items
    custom: [] as Array<{
      label: string;
      href: string;
      icon?: string;
    }>,
  },
};

// =============================================================================
// EXPORT
// =============================================================================

const clientConfig = {
  branding,
  features,
  puckConfig,
  theme,
  integrations,
  admin,
};

export default clientConfig;
export type ClientConfig = typeof clientConfig;
