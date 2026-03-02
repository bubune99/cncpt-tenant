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
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-12">
        {/* Sidebar Navigation - horizontal scrollable on mobile, sidebar on desktop */}
        <aside className="lg:col-span-1 order-first">
          <div className="lg:sticky lg:top-24">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Legal</h3>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 -mx-1 lg:mx-0">
              {legalPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="block py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm whitespace-nowrap lg:whitespace-normal"
                >
                  {page.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Page Content */}
        <div className="lg:col-span-3">
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
