import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a call",
  description:
    "Schedule a call with the CNCPT Web team — get help with onboarding, custom plans, or technical questions.",
  alternates: {
    canonical: "https://cncptweb.com/book",
  },
  openGraph: {
    title: "Book a call | CNCPT Web",
    description:
      "Schedule a call with the CNCPT Web team — onboarding, custom plans, or technical questions.",
    url: "https://cncptweb.com/book",
    type: "website",
  },
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
