/**
 * Hooks exports
 */

export { useAuth } from '../hooks/use-auth'
export { useIsMobile } from '../hooks/use-mobile'
export { useMediaUpload } from '../hooks/use-media-upload'
export { usePermissions } from '../hooks/usePermissions'

// CMS Config context and hook for multi-tenant support
export { useCMSConfig, CMSConfigProvider } from '../contexts/CMSConfigContext'
export type { CMSConfig } from '../contexts/CMSConfigContext'

// Re-export debounce hooks from usehooks-ts
export { useDebounceValue, useDebounceCallback } from 'usehooks-ts'
