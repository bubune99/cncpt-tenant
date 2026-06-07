"use client";
/**
 * Error boundary for the per-tenant /admin/products subtree.
 *
 * Catches unhandled exceptions thrown by the products list and product editor
 * (Atlas) routes so a thrown render error does not blank the whole admin shell.
 *
 * Audit reference: ATLAS-COMPLETENESS-AUDIT R12.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ProductsErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  // Log to console so the error shows up in browser devtools + Vercel runtime logs.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[admin/products] runtime error:", error);
  }, [error]);

  const params = useParams<{ subdomain?: string }>();
  const subdomain = params?.subdomain ?? "";

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-xl mx-auto mt-12 rounded-lg border border-destructive/40 bg-destructive/5 p-6">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">
          The products editor hit an unexpected error. The rest of the admin is still usable.
        </p>
        {error?.message && (
          <pre className="text-xs bg-background border border-border rounded p-3 overflow-auto max-h-48 mb-4">
            {error.message}
            {error.digest ? `\n\n(digest: ${error.digest})` : ""}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
          <Link
            href={"/admin/products"}
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to products
          </Link>
        </div>
      </div>
    </div>
  );
}
