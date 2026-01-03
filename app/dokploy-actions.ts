"use server"

/**
 * Dokploy Server Actions
 *
 * Server actions for managing Dokploy resources from the dashboard.
 * These handle VPS frontend deployments and domain management.
 */

import { getAuthenticatedUser } from "@/lib/auth-utils"
import {
  getDokployClient,
  DokployDomain,
  DokployProject,
  DokployApplication,
  DokployDeployment,
  DnsValidationResult,
  DokployError,
  DokployAuthError,
  CreateDomainInput,
  UpdateDomainInput,
} from "@/lib/dokploy"

// ==================== Domain Actions ====================

export interface DokployDomainWithStatus extends DokployDomain {
  validationStatus?: "pending" | "valid" | "invalid"
  validationError?: string
}

/**
 * Create a new domain in Dokploy
 */
export async function createDokployDomain(input: CreateDomainInput): Promise<DokployDomain> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    const domain = await client.createDomain(input)

    // If HTTPS is enabled with Let's Encrypt, trigger certificate generation
    if (input.https && input.certificateType === "letsencrypt") {
      try {
        await client.generateDomainCertificate(domain.domainId!)
      } catch (certError) {
        console.warn("Certificate generation initiated but may take time:", certError)
      }
    }

    return domain
  } catch (error) {
    if (error instanceof DokployAuthError) {
      throw new Error("Dokploy authentication failed. Please check your API key configuration.")
    }
    if (error instanceof DokployError) {
      throw new Error(`Failed to create domain: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get a domain by ID
 */
export async function getDokployDomain(domainId: string): Promise<DokployDomain> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getDomainById(domainId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get domain: ${error.message}`)
    }
    throw error
  }
}

/**
 * Update a domain
 */
export async function updateDokployDomain(input: UpdateDomainInput): Promise<DokployDomain> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.updateDomain(input)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to update domain: ${error.message}`)
    }
    throw error
  }
}

/**
 * Delete a domain
 */
export async function deleteDokployDomain(domainId: string): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    await client.deleteDomain(domainId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to delete domain: ${error.message}`)
    }
    throw error
  }
}

/**
 * Validate DNS configuration for a domain
 */
export async function validateDokployDomain(domainId: string): Promise<DnsValidationResult> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.validateDomain(domainId)
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

/**
 * Generate SSL certificate for a domain
 */
export async function generateDokployCertificate(domainId: string): Promise<{ success: boolean; message: string }> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    await client.generateDomainCertificate(domainId)
    return {
      success: true,
      message: "SSL certificate generation initiated. This may take a few minutes.",
    }
  } catch (error) {
    if (error instanceof DokployError) {
      return {
        success: false,
        message: `Failed to generate certificate: ${error.message}`,
      }
    }
    throw error
  }
}

/**
 * Get all domains for an application
 */
export async function getDokployDomainsForApplication(applicationId: string): Promise<DokployDomainWithStatus[]> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    const domains = await client.getDomainsForApplication(applicationId)

    // Optionally validate each domain's DNS status
    const domainsWithStatus: DokployDomainWithStatus[] = await Promise.all(
      domains.map(async (domain) => {
        if (domain.domainId) {
          try {
            const validation = await client.validateDomain(domain.domainId)
            return {
              ...domain,
              validationStatus: validation.isValid ? "valid" : "invalid",
              validationError: validation.error,
            } as DokployDomainWithStatus
          } catch {
            return {
              ...domain,
              validationStatus: "pending",
            } as DokployDomainWithStatus
          }
        }
        return {
          ...domain,
          validationStatus: "pending",
        } as DokployDomainWithStatus
      })
    )

    return domainsWithStatus
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get domains: ${error.message}`)
    }
    throw error
  }
}

// ==================== Project Actions ====================

/**
 * Get all Dokploy projects
 */
export async function getDokployProjects(): Promise<DokployProject[]> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getAllProjects()
  } catch (error) {
    if (error instanceof DokployAuthError) {
      throw new Error("Dokploy authentication failed. Please check your API key configuration.")
    }
    if (error instanceof DokployError) {
      throw new Error(`Failed to get projects: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get a project by ID
 */
export async function getDokployProject(projectId: string): Promise<DokployProject> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getProjectById(projectId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get project: ${error.message}`)
    }
    throw error
  }
}

/**
 * Create a new Dokploy project
 */
export async function createDokployProject(name: string, description?: string): Promise<DokployProject> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.createProject({ name, description })
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to create project: ${error.message}`)
    }
    throw error
  }
}

/**
 * Delete a Dokploy project
 */
export async function deleteDokployProject(projectId: string): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    await client.deleteProject(projectId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }
    throw error
  }
}

// ==================== Application Actions ====================

/**
 * Get an application by ID
 */
export async function getDokployApplication(applicationId: string): Promise<DokployApplication> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getApplicationById(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get application: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get all applications
 */
export async function getDokployApplications(): Promise<DokployApplication[]> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getAllApplications()
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get applications: ${error.message}`)
    }
    throw error
  }
}

/**
 * Deploy an application
 */
export async function deployDokployApplication(applicationId: string): Promise<DokployDeployment> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.deployApplication(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to deploy application: ${error.message}`)
    }
    throw error
  }
}

/**
 * Redeploy an application
 */
export async function redeployDokployApplication(applicationId: string): Promise<DokployDeployment> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.redeployApplication(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to redeploy application: ${error.message}`)
    }
    throw error
  }
}

/**
 * Start an application
 */
export async function startDokployApplication(applicationId: string): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    await client.startApplication(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to start application: ${error.message}`)
    }
    throw error
  }
}

/**
 * Stop an application
 */
export async function stopDokployApplication(applicationId: string): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    await client.stopApplication(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to stop application: ${error.message}`)
    }
    throw error
  }
}

/**
 * Restart an application
 */
export async function restartDokployApplication(applicationId: string): Promise<void> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    await client.restartApplication(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to restart application: ${error.message}`)
    }
    throw error
  }
}

// ==================== Deployment Actions ====================

/**
 * Get deployments for an application
 */
export async function getDokployDeployments(applicationId: string): Promise<DokployDeployment[]> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getDeploymentsByApplication(applicationId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get deployments: ${error.message}`)
    }
    throw error
  }
}

/**
 * Get a single deployment
 */
export async function getDokployDeployment(deploymentId: string): Promise<DokployDeployment> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const client = getDokployClient()
    return await client.getDeploymentById(deploymentId)
  } catch (error) {
    if (error instanceof DokployError) {
      throw new Error(`Failed to get deployment: ${error.message}`)
    }
    throw error
  }
}

// ==================== Utility Actions ====================

/**
 * Check Dokploy server connectivity
 */
export async function checkDokployConnection(): Promise<{
  connected: boolean
  error?: string
  serverUrl?: string
}> {
  try {
    const client = getDokployClient()
    const isHealthy = await client.healthCheck()
    return {
      connected: isHealthy,
      serverUrl: client.getBaseUrl(),
    }
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a configuration error
      if (error.message.includes("DOKPLOY_URL") || error.message.includes("DOKPLOY_API_KEY")) {
        return {
          connected: false,
          error: "Dokploy is not configured. Please set DOKPLOY_URL and DOKPLOY_API_KEY environment variables.",
        }
      }
      return {
        connected: false,
        error: error.message,
      }
    }
    return {
      connected: false,
      error: "Unknown error connecting to Dokploy",
    }
  }
}

/**
 * Get DNS configuration instructions for a domain
 */
export async function getDnsInstructions(
  domain: string,
  serverIp: string
): Promise<{
  aRecord: { type: string; host: string; value: string; ttl: string }
  cnameRecord: { type: string; host: string; value: string; ttl: string }
}> {
  const isSubdomain = domain.split(".").length > 2
  const host = isSubdomain ? domain.split(".")[0] : "@"

  return {
    aRecord: {
      type: "A",
      host: host,
      value: serverIp,
      ttl: "3600",
    },
    cnameRecord: {
      type: "CNAME",
      host: host,
      value: `${serverIp}.`,
      ttl: "3600",
    },
  }
}
