import type React from "react"
import type { Metadata } from "next"
import { Inter, Spectral } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { StackProvider, StackTheme } from "@stackframe/stack"
import { ThemeProvider } from "@/components/theme-provider"
import { stackServerApp } from "../stack"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

// Atlas design system typefaces — display serif, body sans, mono labels.
const spectral = Spectral({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

// Geist + Geist Mono are shipped self-hosted by the official `geist` package
// (not present in next/font/google for Next 14.2.x). They expose fixed CSS
// variables: GeistSans -> --font-geist-sans, GeistMono -> --font-geist-mono.

export const metadata: Metadata = {
  title: {
    default: "CNCPT Web — The CMS That Grows With You",
    template: "%s | CNCPT Web",
  },
  description:
    "Build websites, manage products, publish content, and run marketing campaigns. One platform, unlimited possibilities.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/CNCPT_Web_logo_navy.png",
  },
  openGraph: {
    title: "CNCPT Web — The CMS That Grows With You",
    description:
      "Build websites, manage products, publish content, and run marketing campaigns. One platform, unlimited possibilities.",
    url: "https://cncptweb.com",
    siteName: "CNCPT Web",
    type: "website",
    images: [
      {
        url: "/CNCPT_Web_logo_navy.png",
        width: 1200,
        height: 630,
        alt: "CNCPT Web",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CNCPT Web — The CMS That Grows With You",
    description:
      "Build websites, manage products, publish content, and run marketing campaigns. One platform, unlimited possibilities.",
    images: ["/CNCPT_Web_logo_navy.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Grainy design system fonts — Hanken Grotesk (sans) + Spline Sans Mono.
          Loaded via Google Fonts so grainy.css's --font-sans/--font-mono resolve
          by literal family name. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..800;1,400..600&family=Spline+Sans+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <body
        className={`${inter.variable} ${spectral.variable} ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StackProvider app={stackServerApp}>
            <StackTheme>{children}</StackTheme>
          </StackProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
