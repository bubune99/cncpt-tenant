import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import fs from "fs"
import path from "path"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { mdxComponents } from "@/components/docs/mdx-components"
import manifest from "@/docs/content/manifest.json"

// Build a flat ordered list of all pages for prev/next navigation
const allPages = manifest.sections.flatMap((section) => section.pages)

function getDocContent(slug: string) {
  const filePath = path.join(process.cwd(), "docs", "content", `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, "utf-8")
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: { title: "", description: "" }, body: content }

  const meta: Record<string, string> = {}
  match[1].split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":")
    if (key && rest.length) {
      meta[key.trim()] = rest.join(":").trim()
    }
  })

  return { meta, body: match[2] }
}

export async function generateStaticParams() {
  return [
    { slug: [] }, // /docs index → renders getting-started
    ...allPages.map((page) => ({
      slug: [page.slug],
    })),
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const pageSlug = slug?.[0] || "getting-started"
  const page = allPages.find((p) => p.slug === pageSlug)

  if (!page) return { title: "Not Found | Docs" }

  const content = getDocContent(pageSlug)
  if (!content) return { title: "Not Found | Docs" }

  const { meta } = parseFrontmatter(content)
  return {
    title: `${meta.title || page.title} | CNCPT Web Docs`,
    description: meta.description || "",
  }
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const pageSlug = slug?.[0] || "getting-started"

  const content = getDocContent(pageSlug)
  if (!content) notFound()

  const { body } = parseFrontmatter(content)

  // Find prev/next pages
  const currentIndex = allPages.findIndex((p) => p.slug === pageSlug)
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null

  return (
    <article>
      {/* MDX Content */}
      <div className="prose-docs">
        <MDXRemote source={body} components={mdxComponents} />
      </div>

      {/* Prev / Next navigation */}
      <nav className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        {prevPage ? (
          <Link
            href={`/docs/${prevPage.slug}`}
            className="group flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{prevPage.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextPage ? (
          <Link
            href={`/docs/${nextPage.slug}`}
            className="group flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span>{nextPage.title}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  )
}
