/**
 * Media Library Types
 *
 * Standalone type definitions that don't depend on Prisma client
 * until the database schema is applied and client is regenerated.
 */

// =============================================================================
// STORAGE PROVIDER (mirrors Prisma enum)
// =============================================================================

export type StorageProvider = 'LOCAL' | 'S3' | 'R2' | 'GCS'

// =============================================================================
// BASE TYPES (mirrors Prisma models)
// =============================================================================

export interface MediaBase {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  width: number | null
  height: number | null
  title: string | null
  alt: string | null
  caption: string | null
  description: string | null
  folderId: string | null
  provider: StorageProvider
  bucket: string | null
  key: string | null
  uploadedById: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MediaFolderBase {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  parentId: string | null
  path: string
  depth: number
  position: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MediaTagBase {
  id: string
  name: string
  slug: string
  color: string | null
  createdAt: Date
}

export interface MediaUsageBase {
  id: string
  mediaId: string
  entityType: string
  entityId: string
  fieldName: string | null
  createdAt: Date
}

// =============================================================================
// MEDIA TYPES
// =============================================================================

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other'

export type ViewMode = 'grid' | 'list'

export type SortField = 'name' | 'createdAt' | 'size' | 'type'
export type SortOrder = 'asc' | 'desc'

export interface MediaFilters {
  folderId?: string | null
  type?: MediaType
  search?: string
  tagIds?: string[]
  includeDeleted?: boolean
  page?: number
  limit?: number
  sortBy?: SortField
  sortOrder?: SortOrder
}

export interface MediaWithRelations extends MediaBase {
  folder?: MediaFolderBase | null
  tags?: Array<{ tag: MediaTagBase }>
  usages?: MediaUsageBase[]
  uploadedBy?: { id: string; name: string | null; email: string } | null
  _count?: {
    usages: number
  }
}

export interface MediaListResponse {
  media: MediaWithRelations[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface MediaCreateInput {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  width?: number
  height?: number
  title?: string
  alt?: string
  caption?: string
  description?: string
  folderId?: string
  provider?: StorageProvider
  bucket?: string
  key?: string
  uploadedById?: string
  tagIds?: string[]
}

export interface MediaUpdateInput {
  filename?: string
  title?: string
  alt?: string
  caption?: string
  description?: string
  folderId?: string | null
  tagIds?: string[]
}

// =============================================================================
// FOLDER TYPES
// =============================================================================

export interface FolderWithRelations extends MediaFolderBase {
  parent?: MediaFolderBase | null
  children?: MediaFolderBase[]
  _count?: {
    media: number
    children: number
  }
}

export interface FolderTree extends MediaFolderBase {
  children: FolderTree[]
  mediaCount: number
}

export interface FolderCreateInput {
  name: string
  slug?: string
  description?: string
  color?: string
  icon?: string
  parentId?: string | null
  isPublic?: boolean
}

export interface FolderUpdateInput {
  name?: string
  slug?: string
  description?: string
  color?: string
  icon?: string
  parentId?: string | null
  position?: number
  isPublic?: boolean
}

// =============================================================================
// TAG TYPES
// =============================================================================

export interface TagWithCount extends MediaTagBase {
  _count?: {
    media: number
  }
}

export interface TagCreateInput {
  name: string
  slug?: string
  color?: string
}

export interface TagUpdateInput {
  name?: string
  slug?: string
  color?: string
}

// =============================================================================
// USAGE TYPES
// =============================================================================

export type EntityType = 'product' | 'blog_post' | 'page' | 'category' | 'email_campaign'

export interface UsageInfo {
  id: string
  entityType: EntityType
  entityId: string
  entityTitle: string
  fieldName: string | null
  url: string
  createdAt: Date
}

// =============================================================================
// UPLOAD TYPES
// =============================================================================

export interface UploadOptions {
  folderId?: string
  tagIds?: string[]
  alt?: string
  caption?: string
  title?: string
}

export interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  size?: number
  url?: string
  media?: MediaWithRelations
}

export interface PresignedUrlResponse {
  uploadUrl: string
  key: string
  bucket: string
  provider: StorageProvider
  publicUrl: string
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

export type BulkOperation = 'delete' | 'move' | 'tag' | 'untag' | 'restore'

export interface BulkOperationInput {
  operation: BulkOperation
  mediaIds: string[]
  folderId?: string | null
  tagIds?: string[]
  hardDelete?: boolean
}

export interface BulkOperationResult {
  success: boolean
  affected: number
  errors?: Array<{ id: string; error: string }>
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get media type from MIME type
 */
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType === 'text/plain' ||
    mimeType === 'text/csv' ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint')
  ) {
    return 'document'
  }
  return 'other'
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Get MIME type icon name (Lucide icon)
 */
export function getMediaTypeIcon(mimeType: string): string {
  const type = getMediaType(mimeType)
  switch (type) {
    case 'image':
      return 'Image'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Music'
    case 'document':
      if (mimeType === 'application/pdf') return 'FileText'
      if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'FileSpreadsheet'
      if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation'
      return 'FileText'
    default:
      return 'File'
  }
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((allowed) => {
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -2)
      return mimeType.startsWith(prefix)
    }
    return mimeType === allowed
  })
}

/**
 * Default allowed file types
 */
export const DEFAULT_ALLOWED_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]

/**
 * Default max file size (50MB)
 */
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024
