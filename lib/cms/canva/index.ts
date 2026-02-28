/**
 * Canva Connect Integration
 *
 * Provides OAuth connection, design browsing, and import capabilities
 * for the CMS media library integration with Canva.
 */

export {
  getCanvaConfig,
  generatePKCE,
  generateState,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  getValidAccessToken,
  storeCanvaConnection,
  removeCanvaConnection,
  getCanvaUser,
  listDesigns,
  getDesign,
  createExportJob,
  getExportJob,
  waitForExport,
  downloadExport,
  getConnectionStatus,
} from "./client"

export type {
  CanvaConfig,
  CanvaTokenResponse,
  CanvaDesign,
  CanvaDesignListResponse,
  CanvaExportJob,
  CanvaExportFormat,
  CanvaExportRequest,
  CanvaUser,
  CanvaConnectionData,
  CanvaImportOptions,
  CanvaImportResult,
  CanvaScope,
} from "./types"

export { CANVA_SCOPES } from "./types"
