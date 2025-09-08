import { sql } from "your-sql-library" // Import sql library
import type { TenantPost, TenantPage } from "your-model-library" // Import TenantPost and TenantPage models

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
