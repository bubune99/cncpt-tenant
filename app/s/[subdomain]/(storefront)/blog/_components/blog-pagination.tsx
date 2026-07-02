import Link from 'next/link';

/**
 * Prev/next pager shared by every blog listing. `basePath` is the route the
 * pager lives on (e.g. "/blog", "/blog/category/news"); extra query params are
 * preserved via `extraParams`.
 */
export function BlogPagination({
  currentPage,
  totalPages,
  basePath,
  extraParams,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      className="flex items-center justify-between mt-8 sm:mt-12"
      aria-label="Blog pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={hrefFor(currentPage - 1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
          rel="prev"
        >
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={hrefFor(currentPage + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
          rel="next"
        >
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
