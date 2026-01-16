/**
 * Media Library Types
 *
 * Standalone type definitions that don't depend on Prisma client
 * until the database schema is applied and client is regenerated.
 */
type StorageProvider = 'LOCAL' | 'S3' | 'R2' | 'GCS';
interface MediaBase {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    width: number | null;
    height: number | null;
    title: string | null;
    alt: string | null;
    caption: string | null;
    description: string | null;
    folderId: string | null;
    provider: StorageProvider;
    bucket: string | null;
    key: string | null;
    uploadedById: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
interface MediaFolderBase {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    parentId: string | null;
    path: string;
    depth: number;
    position: number;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface MediaTagBase {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    createdAt: Date;
}
interface MediaUsageBase {
    id: string;
    mediaId: string;
    entityType: string;
    entityId: string;
    fieldName: string | null;
    createdAt: Date;
}
type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';
type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'createdAt' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';
interface MediaFilters {
    folderId?: string | null;
    type?: MediaType;
    search?: string;
    tagIds?: string[];
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
    sortBy?: SortField;
    sortOrder?: SortOrder;
}
interface MediaWithRelations extends MediaBase {
    folder?: MediaFolderBase | null;
    tags?: Array<{
        tag: MediaTagBase;
    }>;
    usages?: MediaUsageBase[];
    uploadedBy?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    _count?: {
        usages: number;
    };
}
interface MediaListResponse {
    media: MediaWithRelations[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
interface MediaCreateInput {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    width?: number;
    height?: number;
    title?: string;
    alt?: string;
    caption?: string;
    description?: string;
    folderId?: string;
    provider?: StorageProvider;
    bucket?: string;
    key?: string;
    uploadedById?: string;
    tagIds?: string[];
}
interface MediaUpdateInput {
    filename?: string;
    title?: string;
    alt?: string;
    caption?: string;
    description?: string;
    folderId?: string | null;
    tagIds?: string[];
}
interface FolderWithRelations extends MediaFolderBase {
    parent?: MediaFolderBase | null;
    children?: MediaFolderBase[];
    _count?: {
        media: number;
        children: number;
    };
}
interface FolderTree extends MediaFolderBase {
    children: FolderTree[];
    mediaCount: number;
}
interface FolderCreateInput {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string | null;
    isPublic?: boolean;
}
interface FolderUpdateInput {
    name?: string;
    slug?: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string | null;
    position?: number;
    isPublic?: boolean;
}
interface TagWithCount extends MediaTagBase {
    _count?: {
        media: number;
    };
}
interface TagCreateInput {
    name: string;
    slug?: string;
    color?: string;
}
interface TagUpdateInput {
    name?: string;
    slug?: string;
    color?: string;
}
type EntityType = 'product' | 'blog_post' | 'page' | 'category' | 'email_campaign';
interface UsageInfo {
    id: string;
    entityType: EntityType;
    entityId: string;
    entityTitle: string;
    fieldName: string | null;
    url: string;
    createdAt: Date;
}
interface UploadOptions {
    folderId?: string;
    tagIds?: string[];
    alt?: string;
    caption?: string;
    title?: string;
}
interface UploadProgress {
    id: string;
    filename: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
    size?: number;
    url?: string;
    media?: MediaWithRelations;
}
interface PresignedUrlResponse {
    uploadUrl: string;
    key: string;
    bucket: string;
    provider: StorageProvider;
    publicUrl: string;
}
type BulkOperation = 'delete' | 'move' | 'tag' | 'untag' | 'restore';
interface BulkOperationInput {
    operation: BulkOperation;
    mediaIds: string[];
    folderId?: string | null;
    tagIds?: string[];
    hardDelete?: boolean;
}
interface BulkOperationResult {
    success: boolean;
    affected: number;
    errors?: Array<{
        id: string;
        error: string;
    }>;
}
/**
 * Get media type from MIME type
 */
declare function getMediaType(mimeType: string): MediaType;
/**
 * Get file extension from filename
 */
declare function getFileExtension(filename: string): string;
/**
 * Format file size for display
 */
declare function formatFileSize(bytes: number): string;
/**
 * Generate slug from name
 */
declare function generateSlug(name: string): string;
/**
 * Get MIME type icon name (Lucide icon)
 */
declare function getMediaTypeIcon(mimeType: string): string;
/**
 * Check if file type is allowed
 */
declare function isAllowedFileType(mimeType: string, allowedTypes: string[]): boolean;
/**
 * Default allowed file types
 */
declare const DEFAULT_ALLOWED_TYPES: string[];
/**
 * Default max file size (50MB)
 */
declare const DEFAULT_MAX_FILE_SIZE: number;
interface CorsRule {
    AllowedOrigins: string[];
    AllowedMethods: string[];
    AllowedHeaders: string[];
    ExposeHeaders?: string[];
    MaxAgeSeconds?: number;
}
/**
 * Generate recommended CORS configuration for R2/S3 bucket
 * This configuration is required for browser-based presigned URL uploads
 */
declare function generateCorsConfig(allowedOrigins: string[]): CorsRule[];
/**
 * Get CORS configuration as JSON string for copying to Cloudflare dashboard
 */
declare function getCorsConfigJson(allowedOrigins: string[]): string;

export { DEFAULT_MAX_FILE_SIZE as A, type BulkOperation as B, type CorsRule as C, DEFAULT_ALLOWED_TYPES as D, type EntityType as E, type FolderWithRelations as F, generateCorsConfig as G, getCorsConfigJson as H, type MediaBase as M, type PresignedUrlResponse as P, type StorageProvider as S, type TagWithCount as T, type UsageInfo as U, type ViewMode as V, type MediaFolderBase as a, type MediaTagBase as b, type MediaUsageBase as c, type MediaType as d, type SortField as e, type SortOrder as f, type MediaFilters as g, type MediaWithRelations as h, type MediaListResponse as i, type MediaCreateInput as j, type MediaUpdateInput as k, type FolderTree as l, type FolderCreateInput as m, type FolderUpdateInput as n, type TagCreateInput as o, type TagUpdateInput as p, type UploadOptions as q, type UploadProgress as r, type BulkOperationInput as s, type BulkOperationResult as t, getMediaType as u, getFileExtension as v, formatFileSize as w, generateSlug as x, getMediaTypeIcon as y, isAllowedFileType as z };
