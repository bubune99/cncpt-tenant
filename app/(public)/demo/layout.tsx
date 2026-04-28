import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Live Demo | CNCPT Web",
  description:
    "Explore the CNCPT Web admin dashboard with sample data — no signup required. See subdomain management, analytics, and site tools in action.",
  alternates: {
    canonical: "https://cncptweb.com/demo",
  },
  openGraph: {
    title: "Live Demo | CNCPT Web",
    description:
      "Explore the CNCPT Web admin dashboard with sample data — no signup required.",
    url: "https://cncptweb.com/demo",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
