/**
 * Client Configuration
 *
 * This file contains all client-specific settings. Modify this file to customize
 * the CMS for your needs. This file is SAFE to edit and won't conflict with
 * upstream updates.
 *
 * After forking, this is your main configuration file.
 */

import { clientTheme } from '@/client/cms/theme';

// =============================================================================
// BRANDING
// =============================================================================

export const branding = {
  siteName: 'My Site',
  siteDescription: 'A Next.js CMS powered site',
  logo: {
    light: '/logo.svg',
    dark: '/logo-dark.svg',
    width: 120,
    height: 40,
  },
  favicon: '/favicon.ico',
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

  // Customer-facing
  customerDashboard: true,

  // Advanced
  analytics: false,
  multiLanguage: false,
  scheduling: false,
};

// =============================================================================
// THEME
// =============================================================================

export const theme = {
  ...clientTheme,

  darkMode: {
    enabled: true,
    default: 'system' as 'light' | 'dark' | 'system',
  },
};

// =============================================================================
// INTEGRATIONS
// =============================================================================

export const integrations = {
  stripe: {
    enabled: true,
  },
  email: {
    provider: 'nodemailer' as 'nodemailer' | 'resend' | 'sendgrid',
  },
  storage: {
    provider: 's3' as 's3' | 'cloudflare' | 'local',
  },
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
  title: 'Admin Dashboard',
  navigation: {
    hidden: [] as string[],
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
  theme,
  integrations,
  admin,
};

export default clientConfig;
export type ClientConfig = typeof clientConfig;
