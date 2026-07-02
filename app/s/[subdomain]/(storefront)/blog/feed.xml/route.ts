/**
 * Tenant-scoped RSS 2.0 feed for the public blog.
 *
 * Serves the latest 20 visible posts (PUBLISHED, plus SCHEDULED posts whose
 * time has passed — see publicPostWhere) for the current subdomain. All URLs
 * and text are XML-escaped.
 */

import { getTenantContext } from '../../../lib/tenant-context';
import {
  getFeedPosts,
  postExcerpt,
  tenantBaseUrl,
  escapeXml,
} from '@/lib/cms/blog/public';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ subdomain: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { subdomain } = await params;
  const tenantContext = await getTenantContext(subdomain);

  if (!tenantContext) {
    return new Response('Tenant not found', { status: 404 });
  }

  const baseUrl = tenantBaseUrl(subdomain);
  const blogUrl = `${baseUrl}/blog`;
  const feedUrl = `${baseUrl}/blog/feed.xml`;
  const posts = await getFeedPosts(tenantContext.id, 20);

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
      const description = postExcerpt(post, 300);
      const categories = post.categories
        .map(({ category }) => `\n      <category>${escapeXml(category.name)}</category>`)
        .join('');

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>${
        post.author?.name ? `\n      <dc:creator>${escapeXml(post.author.name)}</dc:creator>` : ''
      }
      <description>${escapeXml(description)}</description>${categories}
    </item>`;
    })
    .join('\n');

  const lastBuildDate = (posts[0]?.publishedAt ?? new Date()).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(subdomain)} — Blog</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(`Latest posts from ${subdomain}`)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
