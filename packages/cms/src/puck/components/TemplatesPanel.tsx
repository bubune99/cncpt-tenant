'use client'

/**
 * Templates Panel Component
 *
 * Sidebar panel for browsing and inserting Puck templates.
 * Displays templates filtered by the current editor config.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { usePuck, type Config, type Data } from '@measured/puck'
import { TemplateCard, type PuckTemplateData } from './TemplateCard'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { ScrollArea } from '../../components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Loader2, Search, LayoutTemplate, Layers, FileStack } from 'lucide-react'
import { toast } from 'sonner'

interface TemplatesPanelProps {
  currentConfig: string // e.g., 'blog', 'pages', 'email'
  puckConfig: Config
}

type FilterType = 'all' | 'SECTION' | 'PAGE'

export function TemplatesPanel({
  currentConfig,
  puckConfig,
}: TemplatesPanelProps) {
  const { appState, dispatch } = usePuck()
  const [templates, setTemplates] = useState<PuckTemplateData[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        config: currentConfig,
        limit: '100',
      })

      if (search) {
        params.set('search', search)
      }

      if (filterType !== 'all') {
        params.set('type', filterType)
      }

      if (filterCategory !== 'all') {
        params.set('category', filterCategory)
      }

      const response = await fetch(`/api/admin/puck-templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        setCategories(data.categories || [])
      } else {
        console.error('Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentConfig, search, filterType, filterCategory])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Insert template into editor
  const insertTemplate = useCallback(
    (template: PuckTemplateData) => {
      try {
        const templateContent = template.content as Data

        if (template.type === 'PAGE') {
          // Replace entire page content
          dispatch({
            type: 'setData',
            data: templateContent,
          })
          toast.success(`Page template "${template.name}" applied`)
        } else {
          // Insert section components at the end
          const currentContent = appState.data.content || []
          const templateComponents = templateContent.content || []

          dispatch({
            type: 'setData',
            data: {
              ...appState.data,
              content: [...currentContent, ...templateComponents],
            },
          })
          toast.success(`Section "${template.name}" inserted`)
        }
      } catch (error) {
        console.error('Error inserting template:', error)
        toast.error('Failed to insert template')
      }
    },
    [appState.data, dispatch]
  )

  // Filter stats
  const sectionCount = templates.filter((t) => t.type === 'SECTION').length
  const pageCount = templates.filter((t) => t.type === 'PAGE').length

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b p-3">
        {/* Type Filter */}
        <div className="flex flex-1 gap-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="flex-1"
          >
            <LayoutTemplate className="mr-1 h-3 w-3" />
            All
          </Button>
          <Button
            variant={filterType === 'SECTION' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('SECTION')}
            className="flex-1"
          >
            <Layers className="mr-1 h-3 w-3" />
            {sectionCount}
          </Button>
          <Button
            variant={filterType === 'PAGE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('PAGE')}
            className="flex-1"
          >
            <FileStack className="mr-1 h-3 w-3" />
            {pageCount}
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="border-b p-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center">
              <LayoutTemplate className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No templates found</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {search
                  ? 'Try a different search term'
                  : 'Save sections or pages as templates to see them here'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  puckConfig={puckConfig}
                  onClick={() => insertTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-3 py-2">
        <p className="text-center text-[10px] text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? 's' : ''} for{' '}
          <span className="font-medium">{currentConfig}</span>
        </p>
      </div>
    </div>
  )
}

export default TemplatesPanel
