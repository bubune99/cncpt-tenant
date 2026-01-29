'use client'

/**
 * Stats Block Component
 *
 * Display key statistics and metrics.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { cn } from '../../lib/utils'

interface Stat {
  value: string | ReactNode
  label: string | ReactNode
  description?: string | ReactNode
}

export interface StatsBlockProps {
  headline?: string | ReactNode
  subheadline?: string | ReactNode
  variant: 'simple' | 'cards' | 'bordered'
  backgroundColor: 'default' | 'primary' | 'muted'
  stats: Stat[]
}

export function StatsBlock({
  headline,
  subheadline,
  variant = 'simple',
  backgroundColor = 'default',
  stats = [],
}: StatsBlockProps) {
  const bgClasses = {
    default: 'bg-background',
    primary: 'bg-primary text-primary-foreground',
    muted: 'bg-muted',
  }

  return (
    <section className={cn('py-16 lg:py-24', bgClasses[backgroundColor])}>
      <div className="container mx-auto px-4">
        {/* Optional Header */}
        {(headline || subheadline) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {headline && (
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                {headline}
              </h2>
            )}
            {subheadline && (
              <p className={cn(
                'text-lg',
                backgroundColor === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                {subheadline}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className={cn(
          'grid gap-8',
          stats.length === 2 && 'md:grid-cols-2',
          stats.length === 3 && 'md:grid-cols-3',
          stats.length >= 4 && 'md:grid-cols-2 lg:grid-cols-4'
        )}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'text-center p-6',
                variant === 'cards' && 'bg-background rounded-lg shadow-sm',
                variant === 'bordered' && 'border-l-4 border-primary text-left'
              )}
            >
              <div className={cn(
                'text-4xl lg:text-5xl font-bold mb-2',
                backgroundColor === 'primary' && variant !== 'cards' ? 'text-primary-foreground' : 'text-primary'
              )}>
                {stat.value}
              </div>
              <div className={cn(
                'text-lg font-medium',
                backgroundColor === 'primary' && variant !== 'cards' ? 'text-primary-foreground' : 'text-foreground'
              )}>
                {stat.label}
              </div>
              {stat.description && (
                <div className={cn(
                  'text-sm mt-1',
                  backgroundColor === 'primary' && variant !== 'cards' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}>
                  {stat.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const statsBlockConfig: ComponentConfig<StatsBlockProps> = {
  label: 'Statistics',
  fields: {
    headline: {
      type: 'text',
      label: 'Headline (optional)',
      contentEditable: true,
    },
    subheadline: {
      type: 'textarea',
      label: 'Subheadline (optional)',
      contentEditable: true,
    },
    variant: {
      type: 'select',
      label: 'Style',
      options: [
        { label: 'Simple', value: 'simple' },
        { label: 'Cards', value: 'cards' },
        { label: 'Bordered', value: 'bordered' },
      ],
    },
    backgroundColor: {
      type: 'select',
      label: 'Background',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Primary', value: 'primary' },
        { label: 'Muted', value: 'muted' },
      ],
    },
    stats: {
      type: 'array',
      label: 'Statistics',
      arrayFields: {
        value: {
          type: 'text',
          label: 'Value',
          contentEditable: true,
        },
        label: {
          type: 'text',
          label: 'Label',
          contentEditable: true,
        },
        description: {
          type: 'text',
          label: 'Description (optional)',
          contentEditable: true,
        },
      },
      defaultItemProps: {
        value: '100+',
        label: 'Customers',
      },
      getItemSummary: (item: Stat) => `${item.value} - ${item.label}`,
    },
  },
  defaultProps: {
    variant: 'simple',
    backgroundColor: 'muted',
    stats: [
      { value: '10K+', label: 'Active Users', description: 'Growing daily' },
      { value: '99.9%', label: 'Uptime', description: 'Industry leading' },
      { value: '24/7', label: 'Support', description: 'Always available' },
      { value: '150+', label: 'Countries', description: 'Worldwide reach' },
    ],
  },
  render: (props) => <StatsBlock {...props} />,
}
