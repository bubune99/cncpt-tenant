"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, BookOpen, X } from "lucide-react"
import { useState } from "react"
import manifest from "@/docs/content/manifest.json"

interface DocsSidebarProps {
  open?: boolean
  onClose?: () => void
}

export function DocsSidebar({ open, onClose }: DocsSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    () => {
      // Expand all sections by default
      const initial: Record<string, boolean> = {}
      manifest.sections.forEach((section) => {
        initial[section.title] = true
      })
      return initial
    }
  )

  const currentSlug = pathname?.replace("/docs/", "").replace("/docs", "") || "getting-started"

  function toggleSection(title: string) {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto transition-transform lg:sticky lg:top-0 lg:z-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/docs" className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
            <BookOpen className="w-5 h-5" />
            Documentation
          </Link>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {manifest.sections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {section.title}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    expandedSections[section.title] ? "" : "-rotate-90"
                  }`}
                />
              </button>

              {expandedSections[section.title] && (
                <div className="space-y-0.5 mb-3">
                  {section.pages.map((page) => {
                    const isActive = currentSlug === page.slug
                    return (
                      <Link
                        key={page.slug}
                        href={`/docs/${page.slug}`}
                        onClick={onClose}
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {page.title}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
