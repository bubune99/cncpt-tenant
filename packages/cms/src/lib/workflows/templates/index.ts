/**
 * Workflow Template Service
 *
 * Manages pre-built workflow templates that can be installed and customized.
 * Provides one-click installation of common e-commerce automation patterns.
 */

import { prisma } from '../../db'
import type {
  WorkflowTemplate as PrismaWorkflowTemplate,
  WorkflowTemplateCategory,
  Workflow,
  WorkflowTrigger,
  WorkflowStep
} from '@prisma/client'
import { generateNodeId, generateEdgeId, autoLayoutNodes } from '../react-flow'

// =============================================================================
// TYPES
// =============================================================================

export interface WorkflowTemplateWithDetails extends PrismaWorkflowTemplate {
  workflowCount?: number
}

export interface TemplateStepDefinition {
  name: string
  type: string
  order: number
  config?: Record<string, unknown>
  conditions?: Record<string, unknown>
}

export interface InstallTemplateOptions {
  /** Custom name for the workflow (defaults to template name) */
  name?: string
  /** Enable the workflow immediately after install */
  enabled?: boolean
  /** Custom configuration overrides */
  configOverrides?: Record<string, unknown>
  /** Link to a plugin */
  pluginId?: string
}

export interface InstallResult {
  success: boolean
  workflow?: Workflow
  steps?: WorkflowStep[]
  error?: string
}

// =============================================================================
// TEMPLATE QUERIES
// =============================================================================

/**
 * Get all available workflow templates
 */
export async function getWorkflowTemplates(options?: {
  category?: WorkflowTemplateCategory
  search?: string
  onlyActive?: boolean
  includeWorkflowCount?: boolean
}): Promise<WorkflowTemplateWithDetails[]> {
  const {
    category,
    search,
    onlyActive = true,
    includeWorkflowCount = false
  } = options ?? {}

  const templates = await prisma.workflowTemplate.findMany({
    where: {
      ...(onlyActive && { isActive: true }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } }
        ]
      })
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })

  if (includeWorkflowCount) {
    const templateIds = templates.map(t => t.id)
    const workflowCounts = await prisma.workflow.groupBy({
      by: ['templateId'],
      where: { templateId: { in: templateIds } },
      _count: true
    })

    const countMap = new Map(workflowCounts.map(wc => [wc.templateId, wc._count]))

    return templates.map(template => ({
      ...template,
      workflowCount: countMap.get(template.id) ?? 0
    }))
  }

  return templates
}

/**
 * Get a single workflow template by ID or slug
 */
export async function getWorkflowTemplate(
  idOrSlug: string
): Promise<WorkflowTemplateWithDetails | null> {
  const template = await prisma.workflowTemplate.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  })

  if (!template) return null

  const workflowCount = await prisma.workflow.count({
    where: { templateId: template.id }
  })

  return {
    ...template,
    workflowCount
  }
}

/**
 * Get templates by category with counts
 */
export async function getTemplatesByCategory(): Promise<
  Record<WorkflowTemplateCategory, WorkflowTemplateWithDetails[]>
> {
  const templates = await getWorkflowTemplates({
    includeWorkflowCount: true
  })

  const byCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<WorkflowTemplateCategory, WorkflowTemplateWithDetails[]>)

  return byCategory
}

/**
 * Get popular templates (most installed)
 */
export async function getPopularTemplates(limit = 5): Promise<WorkflowTemplateWithDetails[]> {
  const templates = await getWorkflowTemplates({
    includeWorkflowCount: true
  })

  return templates
    .sort((a, b) => (b.workflowCount ?? 0) - (a.workflowCount ?? 0))
    .slice(0, limit)
}

/**
 * Get recommended templates based on what's not yet installed
 */
export async function getRecommendedTemplates(limit = 4): Promise<WorkflowTemplateWithDetails[]> {
  // Get all installed template IDs
  const installedTemplates = await prisma.workflow.findMany({
    where: { templateId: { not: null } },
    select: { templateId: true },
    distinct: ['templateId']
  })

  const installedIds = installedTemplates
    .map(w => w.templateId)
    .filter((id): id is string => id !== null)

  // Get templates that aren't installed yet
  const templates = await prisma.workflowTemplate.findMany({
    where: {
      isActive: true,
      id: { notIn: installedIds },
      tags: { has: 'essential' }
    },
    orderBy: { name: 'asc' },
    take: limit
  })

  return templates
}

// =============================================================================
// TEMPLATE INSTALLATION
// =============================================================================

/**
 * Install a workflow template as a new workflow
 */
export async function installWorkflowTemplate(
  templateIdOrSlug: string,
  options?: InstallTemplateOptions
): Promise<InstallResult> {
  try {
    // Fetch the template
    const template = await getWorkflowTemplate(templateIdOrSlug)

    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateIdOrSlug}`
      }
    }

    // Generate unique slug
    const baseSlug = `${template.slug}-copy`
    let slug = baseSlug
    let counter = 1

    while (await prisma.workflow.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    // Parse step definitions from template
    const stepDefs = template.steps as unknown as TemplateStepDefinition[]

    // Convert step definitions to React Flow nodes/edges
    const { nodes, edges } = convertStepsToReactFlow(stepDefs, options?.configOverrides)

    // Create the workflow
    const workflow = await prisma.workflow.create({
      data: {
        name: options?.name ?? template.name,
        slug,
        description: template.description,
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 },
        triggerType: template.trigger,
        triggerConfig: (template.triggerConfig as object ?? {}) as never,
        config: (options?.configOverrides ?? {}) as never,
        enabled: options?.enabled ?? false,
        templateId: template.id,
        pluginId: options?.pluginId
      }
    })

    // Create workflow steps for easier querying
    const steps = await Promise.all(
      stepDefs.map((step, index) =>
        prisma.workflowStep.create({
          data: {
            workflowId: workflow.id,
            name: step.name,
            type: step.type as any,
            order: step.order ?? index,
            config: (step.config ?? {}) as never,
            conditions: (step.conditions ?? {}) as never,
            enabled: true
          }
        })
      )
    )

    return {
      success: true,
      workflow,
      steps
    }
  } catch (error) {
    console.error('Failed to install workflow template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Convert template step definitions to React Flow format
 */
function convertStepsToReactFlow(
  steps: TemplateStepDefinition[],
  configOverrides?: Record<string, unknown>
): { nodes: object[]; edges: object[] } {
  const nodes: object[] = []
  const edges: object[] = []

  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

  // Create nodes for each step
  sortedSteps.forEach((step, index) => {
    const nodeId = generateNodeId()

    // Map step type to React Flow node type
    const nodeType = mapStepTypeToNodeType(step.type)

    nodes.push({
      id: nodeId,
      type: nodeType,
      position: { x: 250, y: index * 150 },
      data: {
        label: step.name,
        stepType: step.type,
        config: {
          ...step.config,
          ...getConfigOverridesForStep(step.name, configOverrides)
        },
        conditions: step.conditions
      }
    })

    // Create edge to next step (if not the last step)
    if (index < sortedSteps.length - 1) {
      edges.push({
        id: generateEdgeId(nodeId, 'placeholder'),
        source: nodeId,
        target: '', // Will be filled in after all nodes are created
        sourceHandle: 'output',
        targetHandle: 'input'
      })
    }
  })

  // Fix edge targets now that we have all node IDs
  edges.forEach((edge: any, index) => {
    if (index < nodes.length - 1) {
      edge.target = (nodes[index + 1] as any).id
    }
  })

  // Auto-layout the nodes for better visualization
  const layoutedNodes = autoLayoutNodes(nodes as any, edges as any)

  return {
    nodes: layoutedNodes,
    edges
  }
}

/**
 * Map workflow step type to React Flow node type
 */
function mapStepTypeToNodeType(stepType: string): string {
  const typeMap: Record<string, string> = {
    TRIGGER: 'trigger',
    ACTION: 'primitive',
    CONDITION: 'condition',
    DELAY: 'delay',
    LOOP: 'loop',
    TRANSFORM: 'transform',
    HTTP: 'http',
    DATABASE: 'database',
    NOTIFICATION: 'notification',
    END: 'output'
  }

  return typeMap[stepType] ?? 'primitive'
}

/**
 * Get config overrides for a specific step
 */
function getConfigOverridesForStep(
  stepName: string,
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  if (!overrides) return {}

  // Check for step-specific overrides
  const stepKey = stepName.toLowerCase().replace(/\s+/g, '_')
  return (overrides[stepKey] as Record<string, unknown>) ?? {}
}

// =============================================================================
// TEMPLATE MANAGEMENT
// =============================================================================

/**
 * Create a new custom template from an existing workflow
 */
export async function createTemplateFromWorkflow(
  workflowId: string,
  templateData: {
    name: string
    slug: string
    description?: string
    category: WorkflowTemplateCategory
    icon?: string
    color?: string
    tags?: string[]
    documentation?: string
    exampleUseCase?: string
  }
): Promise<PrismaWorkflowTemplate> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { order: 'asc' } } }
  })

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`)
  }

  // Convert workflow steps to template step format
  const steps: TemplateStepDefinition[] = workflow.steps.map(step => ({
    name: step.name,
    type: step.type,
    order: step.order,
    config: step.config as Record<string, unknown> ?? {},
    conditions: step.conditions as Record<string, unknown> ?? {}
  }))

  return prisma.workflowTemplate.create({
    data: {
      name: templateData.name,
      slug: templateData.slug,
      description: templateData.description ?? workflow.description,
      category: templateData.category,
      trigger: workflow.triggerType,
      triggerConfig: (workflow.triggerConfig ?? {}) as never,
      steps: steps as never,
      icon: templateData.icon,
      color: templateData.color,
      tags: templateData.tags ?? [],
      documentation: templateData.documentation,
      exampleUseCase: templateData.exampleUseCase,
      isSystem: false,
      isActive: true
    }
  })
}

/**
 * Update a custom template (system templates cannot be modified)
 */
export async function updateTemplate(
  templateId: string,
  data: Partial<{
    name: string
    description: string
    category: WorkflowTemplateCategory
    icon: string
    color: string
    tags: string[]
    documentation: string
    exampleUseCase: string
    isActive: boolean
  }>
): Promise<PrismaWorkflowTemplate> {
  const template = await prisma.workflowTemplate.findUnique({
    where: { id: templateId }
  })

  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  if (template.isSystem) {
    throw new Error('System templates cannot be modified')
  }

  return prisma.workflowTemplate.update({
    where: { id: templateId },
    data
  })
}

/**
 * Delete a custom template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const template = await prisma.workflowTemplate.findUnique({
    where: { id: templateId }
  })

  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  if (template.isSystem) {
    throw new Error('System templates cannot be deleted')
  }

  // Remove templateId from any workflows using this template
  await prisma.workflow.updateMany({
    where: { templateId },
    data: { templateId: null }
  })

  await prisma.workflowTemplate.delete({
    where: { id: templateId }
  })
}

// =============================================================================
// TEMPLATE STATISTICS
// =============================================================================

/**
 * Get template usage statistics
 */
export async function getTemplateStats(templateId: string): Promise<{
  totalInstalls: number
  activeInstalls: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
}> {
  const workflows = await prisma.workflow.findMany({
    where: { templateId },
    select: {
      id: true,
      enabled: true,
      executionCount: true,
      successCount: true,
      failureCount: true
    }
  })

  const workflowIds = workflows.map(w => w.id)

  // Calculate average execution time from recent executions
  const recentExecutions = await prisma.workflowExecution.findMany({
    where: {
      workflowId: { in: workflowIds },
      status: 'COMPLETED',
      completedAt: { not: null }
    },
    select: {
      startedAt: true,
      completedAt: true
    },
    orderBy: { startedAt: 'desc' },
    take: 100
  })

  const executionTimes = recentExecutions
    .filter(e => e.completedAt)
    .map(e => e.completedAt!.getTime() - e.startedAt.getTime())

  const avgTime = executionTimes.length > 0
    ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    : 0

  return {
    totalInstalls: workflows.length,
    activeInstalls: workflows.filter(w => w.enabled).length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
    successfulExecutions: workflows.reduce((sum, w) => sum + w.successCount, 0),
    failedExecutions: workflows.reduce((sum, w) => sum + w.failureCount, 0),
    averageExecutionTime: Math.round(avgTime)
  }
}

/**
 * Get category statistics
 */
export async function getCategoryStats(): Promise<
  Record<WorkflowTemplateCategory, {
    templateCount: number
    workflowCount: number
  }>
> {
  const templates = await prisma.workflowTemplate.groupBy({
    by: ['category'],
    _count: true
  })

  const workflows = await prisma.workflow.findMany({
    where: { templateId: { not: null } },
    select: { template: { select: { category: true } } }
  })

  const stats: Record<string, { templateCount: number; workflowCount: number }> = {}

  templates.forEach(t => {
    stats[t.category] = {
      templateCount: t._count,
      workflowCount: 0
    }
  })

  workflows.forEach(w => {
    if (w.template?.category && stats[w.template.category]) {
      stats[w.template.category].workflowCount++
    }
  })

  return stats as Record<WorkflowTemplateCategory, { templateCount: number; workflowCount: number }>
}
