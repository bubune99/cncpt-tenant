import { prisma } from "@/lib/cms/db"
import { notFound } from "next/navigation"

export interface TenantData {
  id: number
  subdomain: string
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
  // White-label branding fields
  site_name?: string
  site_tagline?: string
  logo_url?: string
  logo_dark_url?: string
  logo_alt?: string
  favicon_url?: string
  favicon_svg_url?: string
  apple_touch_icon_url?: string
  og_image_url?: string
  primary_color?: string
  accent_color?: string
  title_template?: string
  meta_description?: string
  hide_powered_by?: boolean
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
      siteName: true,
      siteTagline: true,
      logoUrl: true,
      logoDarkUrl: true,
      logoAlt: true,
      faviconUrl: true,
      faviconSvgUrl: true,
      appleTouchIconUrl: true,
      ogImageUrl: true,
      primaryColor: true,
      accentColor: true,
      titleTemplate: true,
      metaDescription: true,
      hidePoweredBy: true,
    },
  })

  if (!result) return null

  return {
    site_title: result.siteTitle || '',
    site_description: result.siteDescription || '',
    theme_color: result.themeColor,
    custom_css: result.customCss || undefined,
    site_name: result.siteName || undefined,
    site_tagline: result.siteTagline || undefined,
    logo_url: result.logoUrl || undefined,
    logo_dark_url: result.logoDarkUrl || undefined,
    logo_alt: result.logoAlt || undefined,
    favicon_url: result.faviconUrl || undefined,
    favicon_svg_url: result.faviconSvgUrl || undefined,
    apple_touch_icon_url: result.appleTouchIconUrl || undefined,
    og_image_url: result.ogImageUrl || undefined,
    primary_color: result.primaryColor || undefined,
    accent_color: result.accentColor || undefined,
    title_template: result.titleTemplate || undefined,
    meta_description: result.metaDescription || undefined,
    hide_powered_by: result.hidePoweredBy ?? undefined,
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

  const s = result.tenantSettings

  return {
    id: result.id,
    subdomain: result.subdomain,
    user_id: result.userId,
    created_at: result.createdAt,
    site_title: s?.siteTitle || null,
    site_description: s?.siteDescription || null,
    theme_color: s?.themeColor || '#0891b2',
    // White-label branding
    site_name: s?.siteName || s?.siteTitle || null,
    logo_url: s?.logoUrl || null,
    logo_dark_url: s?.logoDarkUrl || null,
    favicon_url: s?.faviconUrl || null,
    primary_color: s?.primaryColor || null,
    accent_color: s?.accentColor || null,
    hide_powered_by: s?.hidePoweredBy ?? false,
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
    userId: result.userId,
    createdAt: result.createdAt,
    maintenanceMode: result.maintenanceMode,
    maintenanceMsg: result.maintenanceMsg,
  }
}
