/**
 * Migration Script: Update Puck Content to Use Container Hierarchy
 *
 * This script updates existing blog posts and pages to use the new
 * Section → Row → Column container hierarchy with DropZones.
 *
 * Run with: npx tsx scripts/migrate-puck-content.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Use the same database connection approach as the app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface PuckComponent {
  type: string;
  props: Record<string, unknown>;
}

interface PuckContent {
  root?: { props?: Record<string, unknown> };
  content?: PuckComponent[];
  zones?: Record<string, PuckComponent[]>;
  [key: string]: unknown; // Index signature for Prisma JSON compatibility
}

/**
 * Transforms flat content into a nested container structure
 * Wraps existing components in Section → Row → Column hierarchy
 */
function transformToContainerHierarchy(data: PuckContent): PuckContent {
  if (!data || !data.content || data.content.length === 0) {
    return data;
  }

  // Check if already using container hierarchy
  const hasContainers = data.content.some(
    (c) => ['Section', 'Row', 'Column', 'Container', 'FlexBox', 'Grid'].includes(c.type)
  );

  if (hasContainers) {
    console.log('  Content already uses container components, skipping transformation');
    return data;
  }

  // Group consecutive components of similar types for better organization
  const groupedContent: PuckComponent[][] = [];
  let currentGroup: PuckComponent[] = [];

  data.content.forEach((component, idx) => {
    // Start new group on certain component types or after every 3 items
    const startsNewSection = ['HeroSection', 'ImageGallery', 'CallToAction'].includes(component.type);

    if (startsNewSection && currentGroup.length > 0) {
      groupedContent.push([...currentGroup]);
      currentGroup = [component];
    } else {
      currentGroup.push(component);

      // Create reasonable groupings (max 4 components per row)
      if (currentGroup.length >= 4) {
        groupedContent.push([...currentGroup]);
        currentGroup = [];
      }
    }
  });

  if (currentGroup.length > 0) {
    groupedContent.push(currentGroup);
  }

  // Create the new structure with zones
  const newContent: PuckComponent[] = [];
  const newZones: Record<string, PuckComponent[]> = {};

  groupedContent.forEach((group, sectionIdx) => {
    const sectionId = `section-${sectionIdx}`;
    const rowId = `row-${sectionIdx}`;
    const columnId = `column-${sectionIdx}`;

    // Create Section
    newContent.push({
      type: 'Section',
      props: {
        id: sectionId,
        backgroundColor: 'transparent',
        padding: 'medium',
        maxWidth: 'xl',
      },
    });

    // Create Row inside Section's zone
    newZones[`${sectionId}:section-content`] = [
      {
        type: 'Row',
        props: {
          id: rowId,
          gap: 'medium',
          alignItems: 'stretch',
          justifyContent: 'start',
          wrap: true,
          reverseOnMobile: false,
        },
      },
    ];

    // Create Column inside Row's zone
    newZones[`${rowId}:row-content`] = [
      {
        type: 'Column',
        props: {
          id: columnId,
          width: 'full',
          padding: 'none',
          backgroundColor: 'transparent',
        },
      },
    ];

    // Place original components inside Column's zone
    newZones[`${columnId}:column-content`] = group.map((component, idx) => ({
      ...component,
      props: {
        ...component.props,
        id: component.props.id || `${columnId}-item-${idx}`,
      },
    }));
  });

  return {
    root: data.root || { props: {} },
    content: newContent,
    zones: { ...data.zones, ...newZones },
  };
}

async function migrateBlogPosts() {
  console.log('\n=== Migrating Blog Posts ===\n');

  const posts = await prisma.blogPost.findMany({
    where: {
      puckContent: { not: { equals: null } } as any,
      usePuckLayout: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      puckContent: true,
    },
  });

  console.log(`Found ${posts.length} blog posts with Puck content\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    console.log(`Processing: ${post.title} (${post.slug})`);

    try {
      const originalContent = post.puckContent as PuckContent;
      const transformedContent = transformToContainerHierarchy(originalContent);

      // Only update if content was actually transformed
      if (JSON.stringify(originalContent) !== JSON.stringify(transformedContent)) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { puckContent: transformedContent as any },
        });
        console.log(`  ✓ Migrated successfully`);
        migratedCount++;
      } else {
        console.log(`  - No changes needed`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error migrating: ${error}`);
    }
  }

  console.log(`\nBlog Posts: ${migratedCount} migrated, ${skippedCount} skipped`);
}

async function migratePages() {
  console.log('\n=== Migrating Pages ===\n');

  const pages = await prisma.page.findMany({
    where: {
      content: { not: { equals: null } } as any,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
    },
  });

  console.log(`Found ${pages.length} pages with Puck content\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const page of pages) {
    console.log(`Processing: ${page.title} (${page.slug})`);

    try {
      const originalContent = page.content as PuckContent;
      const transformedContent = transformToContainerHierarchy(originalContent);

      // Only update if content was actually transformed
      if (JSON.stringify(originalContent) !== JSON.stringify(transformedContent)) {
        await prisma.page.update({
          where: { id: page.id },
          data: { content: transformedContent as any },
        });
        console.log(`  ✓ Migrated successfully`);
        migratedCount++;
      } else {
        console.log(`  - No changes needed`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error migrating: ${error}`);
    }
  }

  console.log(`\nPages: ${migratedCount} migrated, ${skippedCount} skipped`);
}

async function showCurrentContent() {
  console.log('\n=== Current Database Content (Preview) ===\n');

  // Blog posts
  const posts = await prisma.blogPost.findMany({
    where: {
      puckContent: { not: { equals: null } } as any,
      usePuckLayout: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      puckContent: true,
    },
    take: 5,
  });

  console.log(`Blog Posts with Puck content (showing first 5):`);
  for (const post of posts) {
    const content = post.puckContent as PuckContent;
    const componentTypes = content?.content?.map(c => c.type) || [];
    const hasContainers = componentTypes.some(t =>
      ['Section', 'Row', 'Column', 'Container', 'FlexBox', 'Grid'].includes(t)
    );
    console.log(`  - ${post.title}`);
    console.log(`    Components: ${componentTypes.join(', ') || 'none'}`);
    console.log(`    Has containers: ${hasContainers ? 'Yes' : 'No'}`);
  }

  // Pages
  const pages = await prisma.page.findMany({
    where: {
      content: { not: { equals: null } } as any,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
    },
    take: 5,
  });

  console.log(`\nPages with Puck content (showing first 5):`);
  for (const page of pages) {
    const content = page.content as PuckContent;
    const componentTypes = content?.content?.map(c => c.type) || [];
    const hasContainers = componentTypes.some(t =>
      ['Section', 'Row', 'Column', 'Container', 'FlexBox', 'Grid'].includes(t)
    );
    console.log(`  - ${page.title}`);
    console.log(`    Components: ${componentTypes.join(', ') || 'none'}`);
    console.log(`    Has containers: ${hasContainers ? 'Yes' : 'No'}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const previewOnly = args.includes('--preview') || args.includes('-p');

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Puck Content Migration: Container Hierarchy         ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  if (previewOnly) {
    await showCurrentContent();
    return;
  }

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
    await showCurrentContent();
    return;
  }

  console.log('\n⚡ Running migration...\n');

  await migrateBlogPosts();
  await migratePages();

  console.log('\n✅ Migration complete!');
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
