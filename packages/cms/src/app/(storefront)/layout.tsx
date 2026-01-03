import Link from "next/link";
import { Logo } from '../../components/branding/Logo';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo href="/" size="md" />
          <nav className="flex items-center gap-6">
            <Link
              href="/posts"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/categories"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Categories
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Logo href="/" size="sm" className="mb-4" />
              <p className="text-sm text-muted-foreground">
                A modern content platform powered by Next.js.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/posts"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    All Posts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Subscribe</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with our latest posts.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
