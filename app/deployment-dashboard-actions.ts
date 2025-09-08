"use server"

import { getCurrentUser } from "@/lib/auth"
import { getVercelAPI } from "@/lib/vercel"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface DeploymentOverview {
  totalDeployments: number
  activeDeployments: number
  failedDeployments: number
  totalSubdomains: number
  recentDeployments: Array<{
    id: number
    subdomain: string
    repository_name: string
    status: string
    created_at: string
    vercel_deployment_url?: string
  }>
  deploymentsByStatus: Record<string, number>
  deploymentTrends: Array<{
    date: string
    deployments: number
    successes: number
    failures: number
  }>
}

export async function getDeploymentOverview(): Promise<DeploymentOverview> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    // Get all user's subdomains with repository connections
    const subdomains = await sql`
      SELECT 
        s.id,
        s.subdomain,
        s.created_at,
        rc.repository_name,
        rc.deployment_status,
        rc.last_deployment_at,
        rc.vercel_deployment_url,
        rc.vercel_project_id
      FROM subdomains s
      LEFT JOIN repository_connections rc ON s.id = rc.subdomain_id
      WHERE s.user_id = ${user.id}
      ORDER BY s.created_at DESC
    `

    // Calculate statistics
    const totalSubdomains = subdomains.length
    const connectedSubdomains = subdomains.filter((s) => s.repository_name)
    const totalDeployments = connectedSubdomains.length
    const activeDeployments = connectedSubdomains.filter((s) => s.deployment_status === "deployed").length
    const failedDeployments = connectedSubdomains.filter((s) => s.deployment_status === "error").length

    // Get recent deployments
    const recentDeployments = connectedSubdomains
      .filter((s) => s.last_deployment_at)
      .sort((a, b) => new Date(b.last_deployment_at).getTime() - new Date(a.last_deployment_at).getTime())
      .slice(0, 10)
      .map((s) => ({
        id: s.id,
        subdomain: s.subdomain,
        repository_name: s.repository_name,
        status: s.deployment_status,
        created_at: s.last_deployment_at,
        vercel_deployment_url: s.vercel_deployment_url,
      }))

    // Calculate deployments by status
    const deploymentsByStatus = connectedSubdomains.reduce(
      (acc, s) => {
        const status = s.deployment_status || "not_configured"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Generate deployment trends (last 7 days)
    const deploymentTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayDeployments = connectedSubdomains.filter((s) => {
        if (!s.last_deployment_at) return false
        const deployDate = new Date(s.last_deployment_at).toISOString().split("T")[0]
        return deployDate === dateStr
      })

      deploymentTrends.push({
        date: dateStr,
        deployments: dayDeployments.length,
        successes: dayDeployments.filter((s) => s.deployment_status === "deployed").length,
        failures: dayDeployments.filter((s) => s.deployment_status === "error").length,
      })
    }

    return {
      totalDeployments,
      activeDeployments,
      failedDeployments,
      totalSubdomains,
      recentDeployments,
      deploymentsByStatus,
      deploymentTrends,
    }
  } catch (error) {
    console.error("Failed to get deployment overview:", error)
    throw error
  }
}

export async function getDetailedDeploymentLogs(subdomainId: number) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    // Get repository connection
    const connection = await sql`
      SELECT rc.*, s.subdomain
      FROM repository_connections rc
      JOIN subdomains s ON rc.subdomain_id = s.id
      WHERE rc.subdomain_id = ${subdomainId} AND s.user_id = ${user.id}
    `

    if (!connection[0] || !connection[0].vercel_project_id) {
      return { logs: [], deployments: [] }
    }

    const vercel = getVercelAPI()

    // Get recent deployments from Vercel
    const deploymentsData = await vercel.getProjectDeployments(connection[0].vercel_project_id)

    return {
      subdomain: connection[0].subdomain,
      repository: connection[0].repository_full_name,
      deployments: deploymentsData.deployments.slice(0, 20).map((d) => ({
        id: d.uid,
        url: d.url,
        state: d.state,
        created: new Date(d.created),
        target: d.target,
      })),
    }
  } catch (error) {
    console.error("Failed to get deployment logs:", error)
    throw error
  }
}
