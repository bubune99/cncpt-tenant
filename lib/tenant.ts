import { sql } from "@/lib/neon"

export async function createDefaultTenantContent(tenantId: number, subdomain: string) {
  await sql`
    INSERT INTO tenant_settings (tenant_id, site_title, site_description)
    VALUES (${tenantId}, ${`${subdomain}'s Site`}, ${"Welcome to my awesome site!"})
  `

  await sql`
    INSERT INTO tenant_pages (tenant_id, slug, title, content)
    VALUES (
      ${tenantId}, 
      'home', 
      'Welcome', 
      'This is your new site! You can customize this content from your admin panel.'
    )
  `

  await sql`
    INSERT INTO tenant_pages (tenant_id, slug, title, content)
    VALUES (
      ${tenantId}, 
      'about', 
      'About Us', 
      'Tell your visitors about yourself and your site.'
    )
  `

  await sql`
    INSERT INTO tenant_posts (tenant_id, slug, title, content, excerpt)
    VALUES (
      ${tenantId}, 
      'welcome-post', 
      'Welcome to My Blog', 
      'This is your first blog post! You can edit or delete this from your admin panel.',
      'Welcome to my new blog!'
    )
  `
}

export async function getTenantBySubdomain(subdomain: string) {
  const result = await sql`
    SELECT s.*, ts.site_title, ts.site_description, ts.primary_color
    FROM subdomains s
    LEFT JOIN tenant_settings ts ON s.id = ts.tenant_id
    WHERE s.subdomain = ${subdomain}
  `

  return result[0] || null
}

export async function getTenantPages(tenantId: number) {
  return await sql`
    SELECT * FROM tenant_pages 
    WHERE tenant_id = ${tenantId} AND is_published = true
    ORDER BY created_at ASC
  `
}

export async function getTenantPosts(tenantId: number) {
  return await sql`
    SELECT * FROM tenant_posts 
    WHERE tenant_id = ${tenantId} AND is_published = true
    ORDER BY created_at DESC
  `
}

export async function getTenantData(subdomain: string) {
  return await getTenantBySubdomain(subdomain)
}

export async function getTenantPost(tenantId: number, slug: string) {
  const result = await sql`
    SELECT * FROM tenant_posts 
    WHERE tenant_id = ${tenantId} AND slug = ${slug} AND is_published = true
  `
  return result[0] || null
}

export async function getTenantPage(tenantId: number, slug: string) {
  const result = await sql`
    SELECT * FROM tenant_pages 
    WHERE tenant_id = ${tenantId} AND slug = ${slug} AND is_published = true
  `
  return result[0] || null
}

export async function getTenantSettings(tenantId: number) {
  const result = await sql`
    SELECT * FROM tenant_settings 
    WHERE tenant_id = ${tenantId}
  `
  return result[0] || null
}

export async function requireTenantOwnership(tenantId: number, userId: string) {
  const result = await sql`
    SELECT * FROM subdomains 
    WHERE id = ${tenantId} AND user_id = ${userId}
  `

  if (!result[0]) {
    throw new Error("Unauthorized: You do not own this tenant")
  }

  return result[0]
}
