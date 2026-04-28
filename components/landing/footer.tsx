"use client"

import Link from "next/link"
import Image from "next/image"

interface FooterProps {
  mounted: boolean
  resolvedTheme: string | undefined
}

const sections = [
  {
    title: "Product",
    tourId: "home-footer-product",
    links: [
      { name: "Demo", href: "/demo", tourId: "home-footer-demo" },
      { name: "Pricing", href: "/pricing", tourId: "home-footer-pricing" },
      { name: "Get Started", href: "/register", tourId: "home-footer-register" },
    ],
  },
  {
    title: "Company",
    tourId: "home-footer-company",
    links: [
      { name: "Book Call", href: "/book", tourId: "home-footer-book" },
      { name: "About", href: "/docs", tourId: "home-footer-docs" },
      { name: "Contact", href: "/book", tourId: "home-footer-contact" },
    ],
  },
  {
    title: "Legal",
    tourId: "home-footer-legal",
    links: [
      { name: "Privacy", href: "/legal/privacy", tourId: "home-footer-privacy" },
      { name: "Terms", href: "/legal/terms", tourId: "home-footer-terms" },
    ],
  },
]

export function Footer({ mounted, resolvedTheme }: FooterProps) {
  return (
    <footer className="py-16 px-6 border-t border-border" data-tour-id="home-footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4" data-tour-id="home-footer-logo">
              {mounted ? (
                <Image
                  src={resolvedTheme === "dark" ? "/CNCPT_Web_logo_white.png" : "/CNCPT_Web_logo_navy.png"}
                  alt="CNCPT Web"
                  width={120}
                  height={35}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="h-8 w-[120px] bg-muted rounded animate-pulse" />
              )}
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The all-in-one platform for building and managing your online business.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title} data-tour-id={section.tourId}>
              <h3 className="text-sm font-medium text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      data-tour-id={link.tourId}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground/60">
            &copy; {new Date().getFullYear()} CNCPT Web. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0" data-tour-id="home-footer-socials">
            {[
              { name: "Twitter", href: "https://x.com/cncptweb", tourId: "home-footer-social-twitter" },
              { name: "GitHub", href: "https://github.com/cncptweb", tourId: "home-footer-social-github" },
              { name: "Discord", href: "https://discord.gg/cncptweb", tourId: "home-footer-social-discord" },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow CNCPT Web on ${social.name}`}
                data-tour-id={social.tourId}
                className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {social.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
