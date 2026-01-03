import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { generateSiteMetadata } from '../lib/metadata';
import { StackProvider } from '../components/stack-provider';
import { ThemeProvider } from '../components/theme-provider';
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    return await generateSiteMetadata();
  } catch {
    // Fallback during build or if database is unavailable
    return {
      title: {
        default: process.env.NEXT_PUBLIC_SITE_NAME || "My Site",
        template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || "My Site"}`,
      },
      description: "Welcome to our platform",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StackProvider>
            {children}
            <Toaster richColors position="top-right" />
          </StackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
