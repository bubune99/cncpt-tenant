/**
 * Dokploy API Client
 *
 * This client provides integration with Dokploy for managing:
 * - Projects and applications
 * - Domains and SSL certificates
 * - Deployments and builds
 *
 * Environment Variables Required:
 * - DOKPLOY_URL: The base URL of your Dokploy instance (e.g., https://dokploy.example.com)
 * - DOKPLOY_API_KEY: Your Dokploy API key
 */

import axios, { AxiosError, AxiosInstance } from "axios"

// Types
export interface DokployConfig {
  dokployUrl: string
  apiKey: string
  timeout?: number
}

export interface DokployDomain {
  domainId?: string
  host: string
  path?: string | null
  port?: number | null
  https: boolean
  certificateType: "letsencrypt" | "none" | "custom"
  customCertResolver?: string | null
  applicationId?: string | null
  composeId?: string | null
  serviceName?: string | null
  domainType?: "compose" | "application" | "preview" | null
  previewDeploymentId?: string | null
  internalPath?: string | null
  stripPath: boolean
  createdAt?: string
  uniqueConfigKey?: number
}

export interface DokployProject {
  projectId: string
  name: string
  description?: string
  createdAt: string
  adminId: string
  applications?: DokployApplication[]
}

export interface DokployApplication {
  applicationId: string
  name: string
  appName: string
  description?: string | null
  projectId: string
  createdAt: string
  applicationStatus: "idle" | "running" | "done" | "error"
  buildType?: string
  sourceType?: string
  repository?: string
  branch?: string
  domains?: DokployDomain[]
}

export interface DokployDeployment {
  deploymentId: string
  title: string
  description?: string
  status: "running" | "done" | "error"
  logPath: string
  applicationId: string
  createdAt: string
}

export interface CreateDomainInput {
  host: string
  path?: string | null
  port?: number | null
  https: boolean
  applicationId?: string | null
  certificateType: "letsencrypt" | "none" | "custom"
  customCertResolver?: string | null
  composeId?: string | null
  serviceName?: string | null
  domainType?: "compose" | "application" | "preview" | null
  previewDeploymentId?: string | null
  internalPath?: string | null
  stripPath: boolean
}

export interface UpdateDomainInput {
  domainId: string
  host?: string
  path?: string | null
  port?: number | null
  https?: boolean
  certificateType?: "letsencrypt" | "none" | "custom"
  customCertResolver?: string | null
}

export interface CreateProjectInput {
  name: string
  description?: string
}

export interface CreateApplicationInput {
  name: string
  appName: string
  projectId: string
  description?: string | null
}

export interface DnsValidationResult {
  isValid: boolean
  domain: string
  expectedRecord?: string
  actualRecords?: string[]
  recordType?: string
  error?: string
}

// Error types
export class DokployError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message)
    this.name = "DokployError"
  }
}

export class DokployAuthError extends DokployError {
  constructor(message: string = "Authentication failed - Invalid or expired API key") {
    super(message, 401)
    this.name = "DokployAuthError"
  }
}

export class DokployNotFoundError extends DokployError {
  constructor(message: string = "Resource not found") {
    super(message, 404)
    this.name = "DokployNotFoundError"
  }
}

// Client class
class DokployClient {
  private client: AxiosInstance
  private static instance: DokployClient | null = null

  private constructor(config: DokployConfig) {
    this.client = axios.create({
      baseURL: config.dokployUrl,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": config.apiKey,
      },
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status
          const data = error.response.data as any
          const message = data?.message || data?.error || error.message

          switch (status) {
            case 401:
              throw new DokployAuthError(message)
            case 404:
              throw new DokployNotFoundError(message)
            default:
              throw new DokployError(message, status, data)
          }
        } else if (error.request) {
          throw new DokployError("Network error - No response received from Dokploy server")
        } else {
          throw new DokployError(error.message)
        }
      }
    )
  }

  static getInstance(): DokployClient {
    if (!DokployClient.instance) {
      const dokployUrl = process.env.DOKPLOY_URL
      const apiKey = process.env.DOKPLOY_API_KEY

      if (!dokployUrl) {
        throw new Error("Environment variable DOKPLOY_URL is not defined")
      }
      if (!apiKey) {
        throw new Error("Environment variable DOKPLOY_API_KEY is not defined")
      }

      DokployClient.instance = new DokployClient({
        dokployUrl,
        apiKey,
        timeout: parseInt(process.env.DOKPLOY_TIMEOUT || "30000", 10),
      })
    }
    return DokployClient.instance
  }

  // Reset instance (useful for testing or when config changes)
  static resetInstance(): void {
    DokployClient.instance = null
  }

  // ==================== Domain Management ====================

  async createDomain(input: CreateDomainInput): Promise<DokployDomain> {
    const response = await this.client.post("/domain.create", input)
    return response.data
  }

  async getDomainById(domainId: string): Promise<DokployDomain> {
    const response = await this.client.post("/domain.one", { domainId })
    return response.data
  }

  async updateDomain(input: UpdateDomainInput): Promise<DokployDomain> {
    const response = await this.client.post("/domain.update", input)
    return response.data
  }

  async deleteDomain(domainId: string): Promise<void> {
    await this.client.post("/domain.delete", { domainId })
  }

  async generateDomainCertificate(domainId: string): Promise<void> {
    await this.client.post("/domain.generateDomain", { domainId })
  }

  async validateDomain(domainId: string): Promise<DnsValidationResult> {
    try {
      const response = await this.client.post("/domain.validateDomain", { domainId })
      return {
        isValid: true,
        domain: response.data.host || response.data.domain,
        ...response.data,
      }
    } catch (error) {
      if (error instanceof DokployError) {
        return {
          isValid: false,
          domain: "",
          error: error.message,
        }
      }
      throw error
    }
  }

  // Get all domains for an application
  async getDomainsForApplication(applicationId: string): Promise<DokployDomain[]> {
    const app = await this.getApplicationById(applicationId)
    return app.domains || []
  }

  // ==================== Project Management ====================

  async createProject(input: CreateProjectInput): Promise<DokployProject> {
    const response = await this.client.post("/project.create", input)
    return response.data
  }

  async getAllProjects(): Promise<DokployProject[]> {
    const response = await this.client.get("/project.all")
    return response.data
  }

  async getProjectById(projectId: string): Promise<DokployProject> {
    const response = await this.client.post("/project.one", { projectId })
    return response.data
  }

  async updateProject(projectId: string, data: Partial<CreateProjectInput>): Promise<DokployProject> {
    const response = await this.client.post("/project.update", { projectId, ...data })
    return response.data
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.client.post("/project.remove", { projectId })
  }

  // ==================== Application Management ====================

  async createApplication(input: CreateApplicationInput): Promise<DokployApplication> {
    const response = await this.client.post("/application.create", input)
    return response.data
  }

  async getApplicationById(applicationId: string): Promise<DokployApplication> {
    const response = await this.client.post("/application.one", { applicationId })
    return response.data
  }

  async getAllApplications(): Promise<DokployApplication[]> {
    const response = await this.client.get("/application.all")
    return response.data
  }

  async updateApplication(
    applicationId: string,
    data: Partial<Omit<CreateApplicationInput, "projectId">>
  ): Promise<DokployApplication> {
    const response = await this.client.post("/application.update", { applicationId, ...data })
    return response.data
  }

  async deleteApplication(applicationId: string): Promise<void> {
    await this.client.post("/application.delete", { applicationId })
  }

  async startApplication(applicationId: string): Promise<void> {
    await this.client.post("/application.start", { applicationId })
  }

  async stopApplication(applicationId: string): Promise<void> {
    await this.client.post("/application.stop", { applicationId })
  }

  async restartApplication(applicationId: string): Promise<void> {
    await this.client.post("/application.restart", { applicationId })
  }

  async deployApplication(applicationId: string): Promise<DokployDeployment> {
    const response = await this.client.post("/application.deploy", { applicationId })
    return response.data
  }

  async redeployApplication(applicationId: string): Promise<DokployDeployment> {
    const response = await this.client.post("/application.redeploy", { applicationId })
    return response.data
  }

  // ==================== Deployment Management ====================

  async getDeploymentsByApplication(applicationId: string): Promise<DokployDeployment[]> {
    const response = await this.client.post("/deployment.all", { applicationId })
    return response.data
  }

  async getDeploymentById(deploymentId: string): Promise<DokployDeployment> {
    const response = await this.client.post("/deployment.one", { deploymentId })
    return response.data
  }

  // ==================== Utility Methods ====================

  // Check if Dokploy server is reachable
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/project.all")
      return true
    } catch {
      return false
    }
  }

  // Get the base URL (useful for displaying to users)
  getBaseUrl(): string {
    return this.client.defaults.baseURL || ""
  }
}

// Export singleton getter
export function getDokployClient(): DokployClient {
  return DokployClient.getInstance()
}

// Export convenience functions that use the singleton
export async function createDomain(input: CreateDomainInput): Promise<DokployDomain> {
  return getDokployClient().createDomain(input)
}

export async function getDomainById(domainId: string): Promise<DokployDomain> {
  return getDokployClient().getDomainById(domainId)
}

export async function updateDomain(input: UpdateDomainInput): Promise<DokployDomain> {
  return getDokployClient().updateDomain(input)
}

export async function deleteDomain(domainId: string): Promise<void> {
  return getDokployClient().deleteDomain(domainId)
}

export async function validateDomain(domainId: string): Promise<DnsValidationResult> {
  return getDokployClient().validateDomain(domainId)
}

export async function generateDomainCertificate(domainId: string): Promise<void> {
  return getDokployClient().generateDomainCertificate(domainId)
}

export async function getAllProjects(): Promise<DokployProject[]> {
  return getDokployClient().getAllProjects()
}

export async function getProjectById(projectId: string): Promise<DokployProject> {
  return getDokployClient().getProjectById(projectId)
}

export async function createProject(input: CreateProjectInput): Promise<DokployProject> {
  return getDokployClient().createProject(input)
}

export async function getApplicationById(applicationId: string): Promise<DokployApplication> {
  return getDokployClient().getApplicationById(applicationId)
}

export async function deployApplication(applicationId: string): Promise<DokployDeployment> {
  return getDokployClient().deployApplication(applicationId)
}

export async function redeployApplication(applicationId: string): Promise<DokployDeployment> {
  return getDokployClient().redeployApplication(applicationId)
}

export async function dokployHealthCheck(): Promise<boolean> {
  return getDokployClient().healthCheck()
}
