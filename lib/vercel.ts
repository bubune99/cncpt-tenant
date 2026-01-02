interface VercelProject {
  id: string
  name: string
  accountId: string
  createdAt: number
  updatedAt: number
  link?: {
    type: string
    repo: string
    repoId: number
    org: string
    gitCredentialId: string
  }
}

interface VercelDeployment {
  uid: string
  name: string
  url: string
  created: number
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED"
  type: "LAMBDAS"
  meta: Record<string, any>
  target: "production" | "staging"
  aliasAssigned: boolean
  aliasError?: any
}

interface CreateProjectOptions {
  name: string
  gitRepository?: {
    type: "github"
    repo: string
    org: string
  }
  buildCommand?: string
  outputDirectory?: string
  installCommand?: string
  environmentVariables?: Array<{
    key: string
    value: string
    type: "encrypted" | "plain"
    target: Array<"production" | "preview" | "development">
  }>
}

interface CreateDeploymentOptions {
  name: string
  gitSource: {
    type: "github"
    repo: string
    ref: string
    org: string
  }
  projectSettings?: {
    buildCommand?: string
    outputDirectory?: string
    installCommand?: string
  }
  env?: Record<string, string>
  target?: "production" | "staging"
}

class VercelAPI {
  private baseURL = "https://api.vercel.com"
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vercel API error (${response.status}): ${error}`)
    }

    return response.json()
  }

  async createProject(options: CreateProjectOptions): Promise<VercelProject> {
    const body: any = {
      name: options.name,
    }

    if (options.gitRepository) {
      body.gitRepository = options.gitRepository
    }

    if (options.buildCommand || options.outputDirectory || options.installCommand) {
      body.buildCommand = options.buildCommand
      body.outputDirectory = options.outputDirectory
      body.installCommand = options.installCommand
    }

    if (options.environmentVariables) {
      body.environmentVariables = options.environmentVariables
    }

    return this.request("/v10/projects", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async getProject(projectId: string): Promise<VercelProject> {
    return this.request(`/v9/projects/${projectId}`)
  }

  async updateProject(projectId: string, updates: Partial<CreateProjectOptions>): Promise<VercelProject> {
    return this.request(`/v9/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}`, {
      method: "DELETE",
    })
  }

  async createDeployment(options: CreateDeploymentOptions): Promise<VercelDeployment> {
    const body: any = {
      name: options.name,
      gitSource: options.gitSource,
      target: options.target || "production",
    }

    if (options.projectSettings) {
      body.projectSettings = options.projectSettings
    }

    if (options.env) {
      body.env = options.env
    }

    return this.request("/v13/deployments", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.request(`/v13/deployments/${deploymentId}`)
  }

  async getProjectDeployments(projectId: string): Promise<{ deployments: VercelDeployment[] }> {
    return this.request(`/v6/deployments?projectId=${projectId}`)
  }

  async addDomain(projectId: string, domain: string): Promise<any> {
    return this.request(`/v9/projects/${projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domain }),
    })
  }

  async removeDomain(projectId: string, domain: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}/domains/${domain}`, {
      method: "DELETE",
    })
  }

  async setEnvironmentVariables(
    projectId: string,
    variables: Array<{
      key: string
      value: string
      type?: "encrypted" | "plain"
      target?: Array<"production" | "preview" | "development">
    }>,
  ): Promise<any> {
    const promises = variables.map((variable) =>
      this.request(`/v9/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify({
          key: variable.key,
          value: variable.value,
          type: variable.type || "encrypted",
          target: variable.target || ["production", "preview", "development"],
        }),
      }),
    )

    return Promise.all(promises)
  }
}

// Singleton instance
let vercelAPI: VercelAPI | null = null

export function getVercelAPI(): VercelAPI {
  if (!vercelAPI) {
    const token = process.env.VERCEL_API_TOKEN
    if (!token) {
      throw new Error("VERCEL_API_TOKEN environment variable is required")
    }
    vercelAPI = new VercelAPI(token)
  }
  return vercelAPI
}

export type { VercelProject, VercelDeployment, CreateProjectOptions, CreateDeploymentOptions }
