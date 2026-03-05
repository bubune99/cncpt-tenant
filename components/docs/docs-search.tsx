"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { Search, FileText } from "lucide-react"
import Fuse from "fuse.js"
import manifest from "@/docs/content/manifest.json"

interface SearchItem {
  slug: string
  title: string
  section: string
  description: string
}

// Build the search index from the manifest
const searchItems: SearchItem[] = manifest.sections.flatMap((section) =>
  section.pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    section: section.title,
    description: "",
  }))
)

export function DocsSearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fuse = useMemo(
    () =>
      new Fuse(searchItems, {
        keys: ["title", "section", "description"],
        threshold: 0.4,
        includeMatches: true,
      }),
    []
  )

  const results = query.length > 0 ? fuse.search(query).slice(0, 8) : []

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut: Ctrl+K to focus
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const input = wrapperRef.current?.querySelector("input")
        input?.focus()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search docs..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-12 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          Ctrl K
        </kbd>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden">
          {results.map(({ item }) => (
            <Link
              key={item.slug}
              href={`/docs/${item.slug}`}
              onClick={() => {
                setIsOpen(false)
                setQuery("")
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.section}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length > 0 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No results for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}
