import { permanentRedirect } from 'next/navigation';

/**
 * Legacy blog index. The public blog now lives at /blog (canonical, matches the
 * sitemap and RSS). Redirect old /posts links permanently.
 */
export default function LegacyPostsIndex() {
  permanentRedirect('/blog');
}
