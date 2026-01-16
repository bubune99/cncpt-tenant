/**
 * Admin components exports
 * These are the main admin UI components for the CMS
 */

// Admin Shell - main layout component
export { AdminShell } from '../app/admin/AdminShell'

// Admin components (default exports)
// BrandingSettingsPanel to avoid conflict with BrandingSettings interface from lib/settings
export { default as BrandingSettingsPanel } from '../components/admin/BrandingSettings'
export { default as DashboardMetrics } from '../components/admin/DashboardMetrics'
export { default as QuickActions } from '../components/admin/QuickActions'
export { MediaPicker } from '../components/admin/MediaPicker'
export { default as EnvManager } from '../components/admin/EnvManager'
export { default as EmailProviderSettings } from '../components/admin/EmailProviderSettings'

// Media management
export * from '../components/admin/media'

// Admin Chat
export { AdminChat, ChatPanel } from '../components/admin-chat'

// Branding
export { Logo } from '../components/branding/Logo'
