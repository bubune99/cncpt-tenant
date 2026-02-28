/**
 * Canva Connect API Types
 *
 * Type definitions for the Canva REST API v1.
 * Based on https://www.canva.dev/docs/connect/
 */

// =============================================================================
// OAUTH
// =============================================================================

export interface CanvaTokenResponse {
  access_token: string
  token_type: "Bearer"
  expires_in: number // seconds
  refresh_token: string
  scope: string
}

export interface CanvaTokenIntrospection {
  active: boolean
  scope?: string
  client_id?: string
  token_type?: string
  exp?: number
  iat?: number
  sub?: string
}

// =============================================================================
// DESIGNS
// =============================================================================

export interface CanvaDesign {
  id: string
  title: string
  owner: {
    user_id: string
    team_id?: string
  }
  thumbnail?: {
    url: string
    width: number
    height: number
  }
  urls: {
    edit_url: string
    view_url: string
  }
  created_at: number // Unix timestamp (seconds)
  updated_at: number // Unix timestamp (seconds)
}

export interface CanvaDesignListResponse {
  items: CanvaDesign[]
  continuation?: string // Pagination cursor
}

// =============================================================================
// EXPORTS
// =============================================================================

export type CanvaExportFormat = "png" | "jpg" | "pdf" | "gif" | "pptx" | "mp4"

export interface CanvaExportRequest {
  design_id: string
  format: {
    type: CanvaExportFormat
    quality?: "regular" | "pro" // PDF quality
    size?: "a4" | "a3" | "letter" | "legal" // PDF paper size
    export_quality?: number // JPG: 1-100
    width?: number // 40-25000 px
    height?: number // 40-25000 px
    lossless?: boolean // PNG lossless
  }
  pages?: number[] // 0-indexed page selection
}

export interface CanvaExportJob {
  id: string
  status: "in_progress" | "success" | "failed"
  urls?: string[] // Download URLs (24-hour expiry)
  error?: {
    code: string
    message: string
  }
}

// =============================================================================
// USERS
// =============================================================================

export interface CanvaUser {
  user_id: string
  display_name: string
  email?: string
  team_id?: string
}

// =============================================================================
// ASSETS (for CMS → Canva upload)
// =============================================================================

export interface CanvaAssetUploadRequest {
  name: string
  name_base64?: string // For non-ASCII names
}

export interface CanvaAssetUploadJob {
  id: string
  status: "in_progress" | "success" | "failed"
  asset?: {
    id: string
    name: string
    tags?: string[]
  }
  error?: {
    code: string
    message: string
  }
}

// =============================================================================
// CLIENT CONFIG
// =============================================================================

export interface CanvaConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface CanvaConnectionData {
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
  canvaUserId?: string
  canvaTeamId?: string
  scopes: string[]
}

// =============================================================================
// IMPORT JOB (internal tracking)
// =============================================================================

export interface CanvaImportOptions {
  designId: string
  format: CanvaExportFormat
  width?: number
  height?: number
  quality?: number // JPG quality
  lossless?: boolean // PNG
  folderId?: string
  tagIds?: string[]
  title?: string
}

export interface CanvaImportResult {
  mediaId: string
  filename: string
  url: string
  mimeType: string
  size: number
  width?: number
  height?: number
  canvaDesignId: string
}

// =============================================================================
// SCOPES
// =============================================================================

export const CANVA_SCOPES = [
  "design:meta:read",
  "design:content:read",
  "asset:read",
  "asset:write",
  "profile:read",
] as const

export type CanvaScope = (typeof CANVA_SCOPES)[number]
