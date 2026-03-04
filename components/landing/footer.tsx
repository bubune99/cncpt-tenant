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
    links: [
      { name: "Demo", href: "/demo" },
      { name: "Pricing", href: "/pricing" },
      { name: "Get Started", href: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "Book Call", href: "/book" },
      { name: "About", href: "#" },
      { name: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
    ],
  },
]

export function Footer({ mounted, resolvedTheme }: FooterProps) {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
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
            <div key={section.title}>
              <h4 className="text-sm font-medium text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
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
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {["Twitter", "GitHub", "Discord"].map((social) => (
              <Link
                key={social}
                href="#"
                className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {social}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
