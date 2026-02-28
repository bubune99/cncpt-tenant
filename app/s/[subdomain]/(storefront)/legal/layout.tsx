import Link from "next/link";

const legalPages = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Refund Policy", href: "/legal/refund" },
  { label: "Shipping Policy", href: "/legal/shipping" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <nav className="space-y-2">
              {legalPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="block py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
                >
                  {page.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Page Content */}
        <div className="lg:col-span-3">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
