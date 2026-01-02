"use server"

import { getCurrentUser } from "@/lib/auth"
import { getVercelAPI } from "@/lib/vercel"
import { getGitHubConnection, createRepositoryConnection, getRepositoryConnection } from "@/lib/github"
import { sql } from "@/lib/neon"

export async function createVercelProject(data: {
  subdomainId: number
  repositoryName: string
  repositoryFullName: string
  repositoryUrl: string
  branch: string
  buildCommand?: string
  outputDirectory?: string
  environmentVariables?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const vercel = getVercelAPI()
    const githubConnection = await getGitHubConnection(user.id)

    if (!githubConnection) {
      throw new Error("GitHub not connected")
    }

    // Parse repository org and name
    const [org, repo] = data.repositoryFullName.split("/")

    // Parse environment variables
    let envVars: Array<{
      key: string
      value: string
      type: "encrypted"
      target: Array<"production" | "preview" | "development">
    }> = []
    if (data.environmentVariables) {
      const lines = data.environmentVariables.split("\n").filter((line) => line.trim())
      envVars = lines.map((line) => {
        const [key, ...valueParts] = line.split("=")
        return {
          key: key.trim(),
          value: valueParts.join("=").trim(),
          type: "encrypted" as const,
          target: ["production", "preview", "development"] as const,
        }
      })
    }

    // Create Vercel project
    const project = await vercel.createProject({
      name: `subdomain-${data.subdomainId}-${repo}`,
      gitRepository: {
        type: "github",
        repo: data.repositoryFullName,
        org: org,
      },
      buildCommand: data.buildCommand,
      outputDirectory: data.outputDirectory,
      environmentVariables: envVars,
    })

    // Store repository connection in database
    await createRepositoryConnection({
      subdomain_id: data.subdomainId,
      github_connection_id: githubConnection.id,
      repository_name: data.repositoryName,
      repository_full_name: data.repositoryFullName,
      repository_url: data.repositoryUrl,
      branch: data.branch,
      build_command: data.buildCommand,
      output_directory: data.outputDirectory,
    })

    // Update repository connection with Vercel project ID
    await sql`
      UPDATE repository_connections 
      SET vercel_project_id = ${project.id}, deployment_status = 'ready'
      WHERE subdomain_id = ${data.subdomainId}
    `

    return { success: true, projectId: project.id }
  } catch (error) {
    console.error("Failed to create Vercel project:", error)
    throw error
  }
}

export async function deployRepository(subdomainId: number) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const repoConnection = await getRepositoryConnection(subdomainId)
    if (!repoConnection) {
      throw new Error("No repository connected to this subdomain")
    }

    if (!repoConnection.vercel_project_id) {
      throw new Error("Vercel project not configured")
    }

    const vercel = getVercelAPI()
    const [org, repo] = repoConnection.repository_full_name.split("/")

    // Create deployment
    const deployment = await vercel.createDeployment({
      name: `subdomain-${subdomainId}-${repo}`,
      gitSource: {
        type: "github",
        repo: repoConnection.repository_full_name,
        ref: repoConnection.branch,
        org: org,
      },
      projectSettings: {
        buildCommand: repoConnection.build_command || undefined,
        outputDirectory: repoConnection.output_directory || undefined,
      },
      target: "production",
    })

    // Update deployment status
    await sql`
      UPDATE repository_connections 
      SET 
        deployment_status = 'building',
        last_deployment_at = NOW(),
        vercel_deployment_url = ${deployment.url}
      WHERE subdomain_id = ${subdomainId}
    `

    return { success: true, deploymentId: deployment.uid, url: deployment.url }
  } catch (error) {
    console.error("Failed to deploy repository:", error)

    // Update deployment status to error
    await sql`
      UPDATE repository_connections 
      SET deployment_status = 'error'
      WHERE subdomain_id = ${subdomainId}
    `

    throw error
  }
}

export async function getDeploymentStatus(subdomainId: number) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const repoConnection = await getRepositoryConnection(subdomainId)
    if (!repoConnection || !repoConnection.vercel_project_id) {
      return { status: "not_configured" }
    }

    const vercel = getVercelAPI()
    const deployments = await vercel.getProjectDeployments(repoConnection.vercel_project_id)

    const latestDeployment = deployments.deployments[0]

    if (latestDeployment) {
      // Update local status based on Vercel status
      const statusMap: Record<string, string> = {
        READY: "deployed",
        BUILDING: "building",
        ERROR: "error",
        CANCELED: "error",
        INITIALIZING: "building",
        QUEUED: "building",
      }

      const localStatus = statusMap[latestDeployment.state] || "unknown"

      await sql`
        UPDATE repository_connections 
        SET 
          deployment_status = ${localStatus},
          vercel_deployment_url = ${latestDeployment.url}
        WHERE subdomain_id = ${subdomainId}
      `

      return {
        status: localStatus,
        url: latestDeployment.url,
        deploymentId: latestDeployment.uid,
        createdAt: new Date(latestDeployment.created),
        vercelState: latestDeployment.state,
      }
    }

    return { status: "no_deployments" }
  } catch (error) {
    console.error("Failed to get deployment status:", error)
    return { status: "error", error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function configureCustomDomain(subdomainId: number, customDomain: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const repoConnection = await getRepositoryConnection(subdomainId)
    if (!repoConnection || !repoConnection.vercel_project_id) {
      throw new Error("Vercel project not configured")
    }

    const vercel = getVercelAPI()

    // Add domain to Vercel project
    await vercel.addDomain(repoConnection.vercel_project_id, customDomain)

    return { success: true }
  } catch (error) {
    console.error("Failed to configure custom domain:", error)
    throw error
  }
}
