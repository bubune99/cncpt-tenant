import { prisma } from "@/lib/cms/db"
import { notFound } from "next/navigation"

export interface TenantData {
  id: number
  subdomain: string
  emoji: string
  userId: string | null
  createdAt: Date
  maintenanceMode: boolean
  maintenanceMsg: string | null
}

export interface TenantSettings {
  site_title: string
  site_description: string
  theme_color: string
  custom_css?: string
}

export interface TenantPost {
  id: number
  title: string
  content: string | null
  slug: string
  published: boolean
  created_at: Date
  updated_at: Date
}

export interface TenantPage {
  id: number
  title: string
  content: string | null
  slug: string
  published: boolean
  created_at: Date
  updated_at: Date
}

// Get tenant data by subdomain using Prisma
export async function getTenantData(subdomain: string): Promise<TenantData | null> {
  const result = await prisma.subdomain.findUnique({
    where: { subdomain },
    select: {
      id: true,
      subdomain: true,
      emoji: true,
      userId: true,
      createdAt: true,
      maintenanceMode: true,
      maintenanceMsg: true,
    },
  })

  if (!result) return null

  return {
    id: result.id,
    subdomain: result.subdomain,
    emoji: result.emoji,
    userId: result.userId,
    createdAt: result.createdAt,
    maintenanceMode: result.maintenanceMode,
    maintenanceMsg: result.maintenanceMsg,
  }
}

// Get tenant settings using Prisma
export async function getTenantSettings(tenantId: number): Promise<TenantSettings | null> {
  const result = await prisma.tenantSetting.findUnique({
    where: { tenantId },
    select: {
      siteTitle: true,
      siteDescription: true,
      themeColor: true,
      customCss: true,
    },
  })

  if (!result) return null

  return {
    site_title: result.siteTitle || '',
    site_description: result.siteDescription || '',
    theme_color: result.themeColor,
    custom_css: result.customCss || undefined,
  }
}

// Get single tenant post by slug using Prisma
export async function getTenantPost(tenantId: number, slug: string): Promise<TenantPost | null> {
  const result = await prisma.tenantPost.findFirst({
    where: {
      tenantId,
      slug,
      published: true,
    },
  })

  if (!result) return null

  return {
    id: result.id,
    title: result.title,
    content: result.content,
    slug: result.slug,
    published: result.published,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
  }
}

// Get single tenant page by slug using Prisma
export async function getTenantPage(tenantId: number, slug: string): Promise<TenantPage | null> {
  const result = await prisma.tenantPage.findFirst({
    where: {
      tenantId,
      slug,
      published: true,
    },
  })

  if (!result) return null

  return {
    id: result.id,
    title: result.title,
    content: result.content,
    slug: result.slug,
    published: result.published,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
  }
}

// Create default content for new tenant using Prisma
export async function createDefaultTenantContent(tenantId: number, subdomain: string): Promise<void> {
  // Create default settings (upsert to avoid conflicts)
  await prisma.tenantSetting.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      siteTitle: `${subdomain} Site`,
      siteDescription: `Welcome to ${subdomain}`,
    },
  })

  // Create default home page (upsert to avoid conflicts)
  await prisma.tenantPage.upsert({
    where: {
      tenantId_slug: { tenantId, slug: 'home' },
    },
    update: {},
    create: {
      tenantId,
      title: 'Home',
      content: `<h1>Welcome to ${subdomain}</h1><p>This is your custom subdomain site. You can customize this content from your dashboard.</p>`,
      slug: 'home',
      published: true,
    },
  })

  // Create default about page (upsert to avoid conflicts)
  await prisma.tenantPage.upsert({
    where: {
      tenantId_slug: { tenantId, slug: 'about' },
    },
    update: {},
    create: {
      tenantId,
      title: 'About',
      content: `<h1>About ${subdomain}</h1><p>Tell your visitors about your site and what makes it special.</p>`,
      slug: 'about',
      published: true,
    },
  })
}

// Get tenant posts using Prisma
export async function getTenantPosts(tenantId: number, publishedOnly = true): Promise<TenantPost[]> {
  const results = await prisma.tenantPost.findMany({
    where: {
      tenantId,
      ...(publishedOnly && { published: true }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    slug: r.slug,
    published: r.published,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }))
}

// Get tenant pages using Prisma
export async function getTenantPages(tenantId: number, publishedOnly = true): Promise<TenantPage[]> {
  const results = await prisma.tenantPage.findMany({
    where: {
      tenantId,
      ...(publishedOnly && { published: true }),
    },
    orderBy: { title: 'asc' },
  })

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    slug: r.slug,
    published: r.published,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }))
}

// Get tenant by subdomain with settings using Prisma
export async function getTenantBySubdomain(subdomain: string) {
  const result = await prisma.subdomain.findUnique({
    where: { subdomain },
    include: {
      tenantSettings: true,
    },
  })

  if (!result) return null

  return {
    id: result.id,
    subdomain: result.subdomain,
    emoji: result.emoji,
    user_id: result.userId,
    created_at: result.createdAt,
    site_title: result.tenantSettings?.siteTitle || null,
    site_description: result.tenantSettings?.siteDescription || null,
    theme_color: result.tenantSettings?.themeColor || '#0891b2',
  }
}

// Require tenant ownership (for authenticated operations)
export async function requireTenantOwnership(subdomain: string, userId: string): Promise<TenantData> {
  const result = await prisma.subdomain.findFirst({
    where: {
      subdomain,
      userId,
    },
    select: {
      id: true,
      subdomain: true,
      emoji: true,
      userId: true,
      createdAt: true,
      maintenanceMode: true,
      maintenanceMsg: true,
    },
  })

  if (!result) {
    notFound()
  }

  return {
    id: result.id,
    subdomain: result.subdomain,
    emoji: result.emoji,
    userId: result.userId,
    createdAt: result.createdAt,
    maintenanceMode: result.maintenanceMode,
    maintenanceMsg: result.maintenanceMsg,
  }
}
