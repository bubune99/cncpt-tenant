/**
 * Dynamic CMS Page Route
 *
 * Renders CMS pages stored in the database.
 * Pages are wrapped with appropriate header/footer based on settings.
 *
 * Route: /p/[...slug]
 * Examples: /p/about, /p/contact, /p/services/consulting
 */

import { prisma } from '@/lib/cms/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageWrapper, getPageLayoutSettings } from '@/components/cms/page-wrapper';
import { BlockPageRenderer } from '@/components/cms/page-wrapper/block-page-renderer';
import type { Block } from '@/lib/cms/block-editor/types';
import {
  registerCommerceFetchers,
  registerDashboardFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from '@/lib/cms/block-editor/smart-blocks';
import { getTenantContext } from '../../../lib/tenant-context';

/** Page content data shape (legacy Puck format) */
interface Data {
  content: Array<{ type: string; props: Record<string, unknown>; [key: string]: unknown }>;
  root?: { props?: Record<string, unknown> };
  zones?: Record<string, unknown[]>;
}

/** Parse block editor v2 content */
function parseBlockEditorContent(content: unknown): Block[] {
  if (!content || typeof content !== 'object') return [];
  const doc = content as Record<string, unknown>;
  if (doc.version === '2.0' && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[];
  }
  return [];
}

export const dynamic = 'force-dynamic';

/**
 * Recursively validate component data
 * Returns true if the component and all its nested content are valid
 */
function isValidComponent(item: unknown, depth = 0): boolean {
  // Prevent infinite recursion
  if (depth > 50) {
    console.warn('Component nesting too deep, stopping validation');
    return false;
  }

  if (!item || typeof item !== 'object') return false;

  const component = item as Record<string, unknown>;

  // Type must be a non-empty string
  if (typeof component.type !== 'string' || !component.type.trim()) {
    console.warn('Invalid component type:', typeof component.type, component.type, 'in component:', JSON.stringify(component).slice(0, 200));
    return false;
  }

  // Check props for nested content arrays (slots)
  if (component.props && typeof component.props === 'object') {
    const props = component.props as Record<string, unknown>;

    // Check all props that might contain nested content
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value)) {
        // This might be a slot with nested components
        for (const nestedItem of value) {
          if (nestedItem && typeof nestedItem === 'object' && 'type' in nestedItem) {
            if (!isValidComponent(nestedItem, depth + 1)) {
              return false;
            }
          }
        }
      } else if (value && typeof value === 'object' && 'type' in value) {
        // Single nested component
        if (!isValidComponent(value, depth + 1)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Validate and sanitize page content data
 * Ensures all component types are strings to prevent rendering errors
 */
function validatePageContent(content: unknown): Data | null {
  if (!content || typeof content !== 'object') return null;

  const data = content as Data;
  if (!Array.isArray(data.content)) return null;

  // Deep validate all components including nested ones
  for (const item of data.content) {
    if (!isValidComponent(item)) {
      console.warn('Invalid page content detected in main content');
      return null; // Return null to trigger error page instead of filtering
    }
  }

  // Also validate zones if present (legacy DropZone content)
  if (data.zones && typeof data.zones === 'object') {
    for (const [zoneName, zoneContent] of Object.entries(data.zones)) {
      if (Array.isArray(zoneContent)) {
        for (const item of zoneContent) {
          if (!isValidComponent(item)) {
            console.warn(`Invalid page content detected in zone: ${zoneName}`);
            return null;
          }
        }
      }
    }
  }

  return data as Data;
}

interface PageProps {
  params: Promise<{ subdomain: string; slug: string[] }>;
}

/**
 * Fetch page by slug with tenant filtering
 */
async function getPage(slugParts: string[], tenantId: number) {
  const slug = '/' + slugParts.join('/');

  const page = await prisma.page.findFirst({
    where: {
      OR: [{ slug: slug }, { slug: slugParts.join('/') }],
      status: 'PUBLISHED',
      tenantId: tenantId,
    },
    include: {
      featuredImage: true,
    },
  });

  return page;
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Site Not Found' };
  }
  const page = await getPage(slug, tenantContext.id);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      type: 'website',
      images: page.featuredImage?.url
        ? [{ url: page.featuredImage.url }]
        : undefined,
    },
  };
}

/**
 * Render error page for invalid content
 */
function ContentErrorPage({ title }: { title: string }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>
      </header>
      <div className="max-w-3xl mx-auto">
        <p className="text-destructive font-medium mb-2">
          Content Error
        </p>
        <p className="text-muted-foreground">
          This page has invalid content data. Please edit the page in the editor to fix it.
        </p>
      </div>
    </div>
  );
}

/**
 * Render the CMS page
 */
export default async function CMSPage({ params }: PageProps) {
  let page;
  let slugParts: string[];

  try {
    const { subdomain, slug } = await params;
    slugParts = slug;

    const tenantContext = await getTenantContext(subdomain);
    if (!tenantContext) {
      notFound();
    }

    page = await getPage(slug, tenantContext.id);
  } catch (error) {
    console.error('Error loading page:', error);
    notFound();
  }

  if (!page) {
    notFound();
  }

  // Check if page has content
  if (!page.content) {
    // Render empty page placeholder
    return (
      <PageWrapper pageSettings={getPageLayoutSettings(page)}>
        <div className="container mx-auto px-4 py-12">
          <header className="max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{page.title}</h1>
          </header>
          <div className="max-w-3xl mx-auto">
            <p className="text-muted-foreground">
              This page has no content yet.
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Validate content
  let validatedContent: Data | null = null;
  try {
    validatedContent = validatePageContent(page.content);
  } catch (error) {
    console.error('Error validating content for page:', slugParts?.join('/'), error);
    validatedContent = null;
  }

  if (!validatedContent) {
    return <ContentErrorPage title={page.title} />;
  }

  // Check if content is block editor v2 format
  const blocks = parseBlockEditorContent(page.content);
  if (blocks.length > 0) {
    // Register smart block fetchers and resolve data
    registerCommerceFetchers();
    registerDashboardFetchers();
    const dataMap = await resolveSmartBlockData(blocks);
    const smartBlockData = serializeSmartBlockData(dataMap);

    return (
      <PageWrapper pageSettings={getPageLayoutSettings(page)}>
        <BlockPageRenderer blocks={blocks} smartBlockData={smartBlockData} />
      </PageWrapper>
    );
  }

  // Legacy content or unrecognized format
  return (
    <PageWrapper pageSettings={getPageLayoutSettings(page)}>
      <div className="container mx-auto px-4 py-12">
        <header className="max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{page.title}</h1>
        </header>
        <div className="max-w-3xl mx-auto">
          <p className="text-muted-foreground">
            Page content available. Editor rendering pending migration.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}

// Note: generateStaticParams is disabled because we use dynamic rendering
// Pages are rendered on-demand.
