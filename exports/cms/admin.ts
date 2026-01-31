/**
 * Admin components exports
 * These are the main admin UI components for the CMS
 */

// Admin Shell - main layout component and config type
export { AdminShell } from '../../app/s/[subdomain]/admin/AdminShell'
export type { AdminShellConfig } from '../../app/s/[subdomain]/admin/AdminShell'

// Admin components (default exports)
// BrandingSettingsPanel to avoid conflict with BrandingSettings interface from lib/settings
export { default as BrandingSettingsPanel } from '../../components/cms/admin/BrandingSettings'
export { default as DashboardMetrics } from '../../components/cms/admin/DashboardMetrics'
export { default as QuickActions } from '../../components/cms/admin/QuickActions'
export { MediaPicker } from '../../components/cms/admin/MediaPicker'
export { default as EnvManager } from '../../components/cms/admin/EnvManager'
export { default as EmailProviderSettings } from '../../components/cms/admin/EmailProviderSettings'

// Media management
export * from '../../components/cms/admin/media'

// Admin Chat
export { AdminChat, ChatPanel } from '../../components/cms/admin-chat'

// Branding
export { Logo } from '../../components/cms/branding/Logo'
