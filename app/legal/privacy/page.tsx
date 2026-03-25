import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "CNCPT Web privacy policy — how we collect, use, and protect your information.",
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^---$/gm, '<hr class="my-6 border-border" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, "</p><p class=\"mb-3 text-muted-foreground\">")
    .replace(/^\|.*\|$/gm, "") // strip markdown tables for simplicity
}

export default function PrivacyPage() {
  const filePath = path.join(process.cwd(), "legal", "privacy-policy.md")
  const content = fs.readFileSync(filePath, "utf-8")
  const html = renderMarkdown(content)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to home
        </Link>
        <article
          className="prose prose-gray dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
