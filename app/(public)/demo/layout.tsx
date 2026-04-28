import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Take a hands-on tour of CNCPT Web — explore the CMS, page builder, and admin tools without signing up.",
  alternates: {
    canonical: "https://cncptweb.com/demo",
  },
  openGraph: {
    title: "Demo | CNCPT Web",
    description:
      "Take a hands-on tour of CNCPT Web — explore the CMS, page builder, and admin tools without signing up.",
    url: "https://cncptweb.com/demo",
    type: "website",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
