import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create your CNCPT Web account in seconds. Build websites, manage content, and ship with one platform.",
  alternates: {
    canonical: "https://cncptweb.com/register",
  },
  openGraph: {
    title: "Sign up | CNCPT Web",
    description:
      "Create your CNCPT Web account in seconds. Build, manage, and ship with one platform.",
    url: "https://cncptweb.com/register",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
