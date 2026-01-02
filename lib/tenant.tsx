import { sql } from "@/lib/neon"
import { notFound } from "next/navigation"

export interface TenantData {
  id: number
  subdomain: string
  emoji: string
  user_id: number
  created_at: string
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
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
}

export interface TenantPage {
  id: number
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
}

// Get tenant data by subdomain
export async function getTenantData(subdomain: string): Promise<TenantData | null> {
  const result = await sql`
    SELECT id, subdomain, emoji, user_id, created_at
    FROM subdomains 
    WHERE subdomain = ${subdomain}
  `

  return (result[0] as TenantData) || null
}

// Get tenant settings
export async function getTenantSettings(tenantId: number): Promise<TenantSettings | null> {
  const result = await sql`
    SELECT site_title, site_description, theme_color, custom_css
    FROM tenant_settings 
    WHERE tenant_id = ${tenantId}
  `

  return (result[0] as TenantSettings) || null
}

// Get single tenant post by slug
export async function getTenantPost(tenantId: number, slug: string): Promise<TenantPost | null> {
  const result = await sql`
    SELECT id, title, content, slug, published, created_at, updated_at
    FROM tenant_posts 
    WHERE tenant_id = ${tenantId} AND slug = ${slug} AND published = true
  `

  return (result[0] as TenantPost) || null
}

// Get single tenant page by slug
export async function getTenantPage(tenantId: number, slug: string): Promise<TenantPage | null> {
  const result = await sql`
    SELECT id, title, content, slug, published, created_at, updated_at
    FROM tenant_pages 
    WHERE tenant_id = ${tenantId} AND slug = ${slug} AND published = true
  `

  return (result[0] as TenantPage) || null
}

// Create default content for new tenant
export async function createDefaultTenantContent(tenantId: number, subdomain: string): Promise<void> {
  // Create default settings
  await sql`
    INSERT INTO tenant_settings (tenant_id, site_title, site_description)
    VALUES (${tenantId}, ${`${subdomain} Site`}, ${`Welcome to ${subdomain}`})
    ON CONFLICT (tenant_id) DO NOTHING
  `

  // Create default home page
  await sql`
    INSERT INTO tenant_pages (tenant_id, title, content, slug)
    VALUES (
      ${tenantId}, 
      'Home', 
      ${`<h1>Welcome to ${subdomain}</h1><p>This is your custom subdomain site. You can customize this content from your dashboard.</p>`},
      'home'
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING
  `

  // Create default about page
  await sql`
    INSERT INTO tenant_pages (tenant_id, title, content, slug)
    VALUES (
      ${tenantId}, 
      'About', 
      ${`<h1>About ${subdomain}</h1><p>Tell your visitors about your site and what makes it special.</p>`},
      'about'
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING
  `
}

// Get tenant posts
export async function getTenantPosts(tenantId: number, publishedOnly = true): Promise<TenantPost[]> {
  const result = publishedOnly
    ? await sql`
        SELECT id, title, content, slug, published, created_at, updated_at
        FROM tenant_posts 
        WHERE tenant_id = ${tenantId} AND published = true
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT id, title, content, slug, published, created_at, updated_at
        FROM tenant_posts 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `

  return result as TenantPost[]
}

// Get tenant pages
export async function getTenantPages(tenantId: number, publishedOnly = true): Promise<TenantPage[]> {
  const result = publishedOnly
    ? await sql`
        SELECT id, title, content, slug, published, created_at, updated_at
        FROM tenant_pages 
        WHERE tenant_id = ${tenantId} AND published = true
        ORDER BY title ASC
      `
    : await sql`
        SELECT id, title, content, slug, published, created_at, updated_at
        FROM tenant_pages 
        WHERE tenant_id = ${tenantId}
        ORDER BY title ASC
      `

  return result as TenantPage[]
}

// Get tenant by subdomain with settings
export async function getTenantBySubdomain(subdomain: string) {
  const result = await sql`
    SELECT s.*, ts.site_title, ts.site_description, ts.theme_color
    FROM subdomains s
    LEFT JOIN tenant_settings ts ON s.id = ts.tenant_id
    WHERE s.subdomain = ${subdomain}
  `

  return result[0] || null
}

// Require tenant ownership (for authenticated operations)
export async function requireTenantOwnership(subdomain: string, userId: number): Promise<TenantData> {
  const result = await sql`
    SELECT id, subdomain, emoji, user_id, created_at
    FROM subdomains 
    WHERE subdomain = ${subdomain} AND user_id = ${userId}
  `

  if (!result[0]) {
    notFound()
  }

  return result[0] as TenantData
}
