"use client"

import { ReactNode, useState } from "react"
import { Menu } from "lucide-react"
import { DocsSidebar } from "./docs-sidebar"
import { DocsSearch } from "./docs-search"

export function DocsLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="flex">
        {/* Sidebar */}
        <DocsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <DocsSearch />
          </header>

          {/* Page content */}
          <main className="max-w-3xl mx-auto px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
