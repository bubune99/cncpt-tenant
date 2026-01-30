/**
 * Database Seed Script
 *
 * Seeds the database with initial data for testing and development
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Create connection pool with the database URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...\n')

  // ============================================================================
  // 1. SEED ADMIN USER
  // ============================================================================
  console.log('👤 Creating admin user...')

  const adminUser = await prisma.user.upsert({
    where: { email: 'bubuneo99@gmail.com' },
    update: {
      role: 'ADMIN',
      name: 'Admin User',
    },
    create: {
      email: 'bubuneo99@gmail.com',
      name: 'Admin User',
      role: 'ADMIN',
      // stackAuthId will be synced automatically when user logs in via Stack Auth
    },
  })
  console.log(`   ✅ Admin user: ${adminUser.email} (${adminUser.id})`)

  // ============================================================================
  // 2. SEED DEFAULT ROLES
  // ============================================================================
  console.log('\n🔐 Creating default roles...')

  const roles = [
    {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full access to all features and settings',
      permissions: JSON.stringify(['*']),
      isSystem: true,
      position: 0,
    },
    {
      name: 'store_manager',
      displayName: 'Store Manager',
      description: 'Manage products, orders, and customers',
      permissions: JSON.stringify([
        'products.*',
        'orders.*',
        'customers.view',
        'customers.edit',
        'media.*',
        'analytics.view',
      ]),
      isSystem: true,
      position: 1,
    },
    {
      name: 'content_editor',
      displayName: 'Content Editor',
      description: 'Create and manage blog posts and pages',
      permissions: JSON.stringify([
        'blog.*',
        'pages.*',
        'media.*',
      ]),
      isSystem: true,
      position: 2,
    },
    {
      name: 'order_fulfillment',
      displayName: 'Order Fulfillment',
      description: 'Process and ship orders',
      permissions: JSON.stringify([
        'orders.view',
        'orders.edit',
        'orders.ship',
        'products.view',
      ]),
      isSystem: true,
      position: 3,
    },
    {
      name: 'support_agent',
      displayName: 'Support Agent',
      description: 'View orders and customer information for support',
      permissions: JSON.stringify([
        'orders.view',
        'customers.view',
        'products.view',
      ]),
      isSystem: true,
      position: 4,
    },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    })
    console.log(`   ✅ Role: ${role.displayName}`)
  }

  // Assign super_admin role to admin user
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'super_admin' },
  })

  if (superAdminRole) {
    await prisma.roleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
        assignedBy: 'system',
      },
    })
    console.log(`   ✅ Assigned super_admin role to ${adminUser.email}`)
  }

  // ============================================================================
  // 3. SEED DEFAULT SETTINGS
  // ============================================================================
  console.log('\n⚙️  Creating default settings...')

  const settings = [
    // Branding
    { key: 'branding.siteName', value: 'My Personal CMS', group: 'branding', encrypted: false },
    { key: 'branding.siteTagline', value: 'A powerful headless CMS', group: 'branding', encrypted: false },
    { key: 'branding.primaryColor', value: '#0066cc', group: 'branding', encrypted: false },
    { key: 'branding.accentColor', value: '#6366f1', group: 'branding', encrypted: false },

    // General/Store
    { key: 'general.siteName', value: 'My Store', group: 'general', encrypted: false },
    { key: 'general.siteUrl', value: 'https://personal-cms-one.vercel.app', group: 'general', encrypted: false },
    { key: 'general.supportEmail', value: 'bubune99@gmail.com', group: 'general', encrypted: false },
    { key: 'general.timezone', value: 'America/New_York', group: 'general', encrypted: false },
    { key: 'general.currency', value: 'USD', group: 'general', encrypted: false },
    { key: 'general.locale', value: 'en-US', group: 'general', encrypted: false },

    // Storage - R2 provider indicator (actual credentials in env vars)
    { key: 'storage.provider', value: 'r2', group: 'storage', encrypted: false },
    { key: 'storage.maxFileSize', value: '50', group: 'storage', encrypted: false },
    { key: 'storage.allowedFileTypes', value: JSON.stringify(['image/*', 'application/pdf', 'video/*']), group: 'storage', encrypted: false },

    // Email settings
    { key: 'email.provider', value: 'smtp', group: 'email', encrypted: false },
    { key: 'email.fromName', value: 'My Store', group: 'email', encrypted: false },
    { key: 'email.fromEmail', value: 'noreply@example.com', group: 'email', encrypted: false },

    // AI settings
    { key: 'ai.enabled', value: 'false', group: 'ai', encrypted: false },
    { key: 'ai.provider', value: 'openai', group: 'ai', encrypted: false },
    { key: 'ai.model', value: 'gpt-4o', group: 'ai', encrypted: false },
    { key: 'ai.maxTokens', value: '4096', group: 'ai', encrypted: false },
    { key: 'ai.temperature', value: '0.7', group: 'ai', encrypted: false },

    // Security settings
    { key: 'security.allowRegistration', value: 'true', group: 'security', encrypted: false },
    { key: 'security.requireEmailVerification', value: 'true', group: 'security', encrypted: false },
    { key: 'security.sessionTimeout', value: '60', group: 'security', encrypted: false },
    { key: 'security.maxLoginAttempts', value: '5', group: 'security', encrypted: false },
    { key: 'security.lockoutDuration', value: '15', group: 'security', encrypted: false },
  ]

  for (const setting of settings) {
    // Use findFirst + create/update pattern for compound unique constraint
    const existing = await prisma.setting.findFirst({
      where: { key: setting.key, tenantId: null },
    })

    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value: setting.value, group: setting.group, encrypted: setting.encrypted },
      })
    } else {
      await prisma.setting.create({
        data: { ...setting, tenantId: null },
      })
    }
  }
  console.log(`   ✅ Created ${settings.length} default settings`)

  // ============================================================================
  // 4. SEED SAMPLE BLOG CATEGORIES
  // ============================================================================
  console.log('\n📁 Creating sample blog categories...')

  const categories = [
    { name: 'Announcements', slug: 'announcements', description: 'Company news and updates' },
    { name: 'Tutorials', slug: 'tutorials', description: 'How-to guides and tutorials' },
    { name: 'Product Updates', slug: 'product-updates', description: 'New features and improvements' },
  ]

  for (const category of categories) {
    // Use findFirst + create/update pattern for compound unique constraint
    const existing = await prisma.blogCategory.findFirst({
      where: { slug: category.slug, tenantId: null },
    })

    if (existing) {
      await prisma.blogCategory.update({
        where: { id: existing.id },
        data: category,
      })
    } else {
      await prisma.blogCategory.create({
        data: { ...category, tenantId: null },
      })
    }
    console.log(`   ✅ Category: ${category.name}`)
  }

  // ============================================================================
  // 5. SEED SAMPLE BLOG TAGS
  // ============================================================================
  console.log('\n🏷️  Creating sample blog tags...')

  const tags = [
    { name: 'Featured', slug: 'featured' },
    { name: 'Getting Started', slug: 'getting-started' },
    { name: 'Tips & Tricks', slug: 'tips-tricks' },
    { name: 'Case Study', slug: 'case-study' },
  ]

  for (const tag of tags) {
    // Use findFirst + create/update pattern for compound unique constraint
    const existing = await prisma.blogTag.findFirst({
      where: { slug: tag.slug, tenantId: null },
    })

    if (existing) {
      await prisma.blogTag.update({
        where: { id: existing.id },
        data: tag,
      })
    } else {
      await prisma.blogTag.create({
        data: { ...tag, tenantId: null },
      })
    }
    console.log(`   ✅ Tag: ${tag.name}`)
  }

  // ============================================================================
  // 6. SEED HOMEPAGE
  // ============================================================================
  console.log('\n📄 Creating homepage...')

  // Use findFirst + create/update pattern for compound unique constraint
  const existingHomepage = await prisma.page.findFirst({
    where: { slug: 'home', tenantId: null },
  })

  let homepage
  if (existingHomepage) {
    homepage = existingHomepage
  } else {
    homepage = await prisma.page.create({
      data: {
        title: 'Home',
        slug: 'home',
        status: 'PUBLISHED',
        content: {
          content: [],
          root: { props: { title: 'Home' } },
        },
        tenantId: null,
      },
    })
  }
  console.log(`   ✅ Homepage created (${homepage.id})`)

  // ============================================================================
  // DONE
  // ============================================================================
  console.log('\n✨ Database seeding completed successfully!\n')
  console.log('You can now:')
  console.log('  1. Log in with bubune99@gmail.com via Stack Auth')
  console.log('  2. Access the admin dashboard at /admin')
  console.log('  3. Manage settings at /admin/settings')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
