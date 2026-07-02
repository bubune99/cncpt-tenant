/**
 * Dashboard AI Tools - Documentation Search
 *
 * Allows the AI chat agent to search platform documentation
 * and return relevant excerpts to answer user questions.
 */

import { tool } from "ai"
import { z } from "zod"
import fs from "fs"
import path from "path"

interface SearchResult {
  title: string
  slug: string
  excerpt: string
  relevance: number
}

function loadManifest() {
  const manifestPath = path.join(process.cwd(), "docs", "content", "manifest.json")
  if (!fs.existsSync(manifestPath)) return { sections: [] }
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
}

function loadDocContent(slug: string): { title: string; body: string } | null {
  const filePath = path.join(process.cwd(), "docs", "content", `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { title: slug, body: raw }

  let title = slug
  match[1].split("\n").forEach((line) => {
    if (line.startsWith("title:")) {
      title = line.replace("title:", "").trim()
    }
  })

  // Strip MDX syntax for plain text search
  const body = match[2]
    .replace(/<[^>]+>/g, "") // Remove JSX/HTML tags
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
    .replace(/[#*_`]/g, "") // Remove markdown formatting

  return { title, body }
}

function searchDocs(query: string): SearchResult[] {
  const manifest = loadManifest()
  const results: SearchResult[] = []

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

  const allPages = manifest.sections.flatMap((s: any) => s.pages)

  for (const page of allPages) {
    const doc = loadDocContent(page.slug)
    if (!doc) continue

    const searchText = `${doc.title} ${doc.body}`.toLowerCase()
    let relevance = 0

    for (const term of terms) {
      // Title matches score higher
      if (doc.title.toLowerCase().includes(term)) relevance += 10
      // Count body occurrences
      const regex = new RegExp(term, "gi")
      const matches = searchText.match(regex)
      if (matches) relevance += matches.length
    }

    if (relevance === 0) continue

    // Extract relevant excerpt (find first paragraph containing a search term)
    const paragraphs = doc.body.split(/\n\n+/).filter((p) => p.trim().length > 20)
    let excerpt = paragraphs[0] || ""

    for (const para of paragraphs) {
      const paraLower = para.toLowerCase()
      if (terms.some((t) => paraLower.includes(t))) {
        excerpt = para.trim()
        break
      }
    }

    // Truncate excerpt
    if (excerpt.length > 300) {
      excerpt = excerpt.slice(0, 300).replace(/\s\S*$/, "") + "..."
    }

    results.push({
      title: doc.title,
      slug: page.slug,
      excerpt,
      relevance,
    })
  }

  // Sort by relevance, return top 3
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 3)
}

/**
 * Create docs tools (no user context needed)
 */
export function createDocsTools() {
  return {
    searchDocs: tool({
      description:
        "Search platform documentation for answers to user questions about features, billing, domains, teams, API, and getting started.",
      inputSchema: z.object({
        query: z.string().describe("Search query — use keywords relevant to the user's question"),
      }),
      execute: async ({ query }) => {
        const results = searchDocs(query)

        if (results.length === 0) {
          return {
            found: false,
            message:
              "No matching documentation found. Try rephrasing the question or check the docs at /docs.",
          }
        }

        return {
          found: true,
          results: results.map((r) => ({
            title: r.title,
            url: `/docs/${r.slug}`,
            excerpt: r.excerpt,
          })),
        }
      },
    }),
  }
}
