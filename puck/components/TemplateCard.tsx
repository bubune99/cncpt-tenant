'use client'

/**
 * Template Card Component
 *
 * Displays a template with a live mini-preview of its Puck content.
 * Used in the TemplatesPanel sidebar to show available templates.
 */

import React, { useMemo } from 'react'
import { Render, type Config, type Data } from '@puckeditor/core'
import { cn } from '../../lib/utils'

export interface PuckTemplateData {
  id: string
  name: string
  slug: string
  description?: string | null
  type: 'SECTION' | 'PAGE'
  compatibleConfigs: string[]
  content: Data
  category?: string | null
  tags: string[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateCardProps {
  template: PuckTemplateData
  puckConfig: Config
  onClick: () => void
  isSelected?: boolean
}

export function TemplateCard({
  template,
  puckConfig,
  onClick,
  isSelected = false,
}: TemplateCardProps) {
  // Memoize the rendered preview to avoid unnecessary re-renders
  const preview = useMemo(() => {
    if (!template.content) return null

    return (
      <Render config={puckConfig} data={template.content as Data} />
    )
  }, [template.content, puckConfig])

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg border-2 bg-card transition-all hover:shadow-md',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Template Name Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <span className="truncate text-sm font-medium">{template.name}</span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
            template.type === 'PAGE'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}
        >
          {template.type}
        </span>
      </div>

      {/* Live Mini-Preview */}
      <div
        className="relative overflow-hidden bg-white"
        style={{ height: 120 }}
      >
        <div
          className="pointer-events-none origin-top-left"
          style={{
            transform: 'scale(0.2)',
            width: '500%',
            height: '500%',
          }}
        >
          {preview}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/5 group-hover:opacity-100">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
            Click to Insert
          </span>
        </div>
      </div>

      {/* Category Tag */}
      {template.category && (
        <div className="border-t bg-muted/20 px-3 py-1.5">
          <span className="text-[11px] text-muted-foreground">
            {template.category}
          </span>
        </div>
      )}

      {/* System Badge */}
      {template.isSystem && (
        <div className="absolute right-2 top-10 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Built-in
        </div>
      )}
    </div>
  )
}

export default TemplateCard
