import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your CNCPT Web sites, settings, and team.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
