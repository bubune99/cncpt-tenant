'use client'

/**
 * CTA Block Component
 *
 * Call-to-action sections with multiple variants.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Button } from '@/components/cms/ui/button'
import { cn } from '@/lib/cms/utils'

export interface CTABlockProps {
  variant: 'simple' | 'split' | 'banner'
  headline: string | ReactNode
  description: string | ReactNode
  primaryButtonText: string | ReactNode
  primaryButtonLink: string
  secondaryButtonText?: string | ReactNode
  secondaryButtonLink?: string
  backgroundColor: 'default' | 'primary' | 'muted'
  image?: string
}

export function CTABlock({
  variant = 'simple',
  headline,
  description,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  backgroundColor = 'default',
  image,
}: CTABlockProps) {
  const bgClasses = {
    default: 'bg-background',
    primary: 'bg-primary text-primary-foreground',
    muted: 'bg-muted',
  }

  if (variant === 'banner') {
    return (
      <section className={cn('py-12', bgClasses[backgroundColor])}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">{headline}</h2>
              <p className={cn('text-lg', backgroundColor === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant={backgroundColor === 'primary' ? 'secondary' : 'default'}
                asChild
              >
                <a href={primaryButtonLink}>{primaryButtonText}</a>
              </Button>
              {secondaryButtonText && (
                <Button
                  size="lg"
                  variant="outline"
                  className={backgroundColor === 'primary' ? 'border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10' : ''}
                  asChild
                >
                  <a href={secondaryButtonLink}>{secondaryButtonText}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'split') {
    return (
      <section className={cn('py-16 lg:py-24', bgClasses[backgroundColor])}>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">{headline}</h2>
              <p className={cn('text-lg mb-6', backgroundColor === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  variant={backgroundColor === 'primary' ? 'secondary' : 'default'}
                  asChild
                >
                  <a href={primaryButtonLink}>{primaryButtonText}</a>
                </Button>
                {secondaryButtonText && (
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                  >
                    <a href={secondaryButtonLink}>{secondaryButtonText}</a>
                  </Button>
                )}
              </div>
            </div>
            {image && (
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                <img src={image} alt="" className="object-cover w-full h-full" />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Simple centered CTA
  return (
    <section className={cn('py-16 lg:py-24', bgClasses[backgroundColor])}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">{headline}</h2>
          <p className={cn('text-lg mb-8', backgroundColor === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
            {description}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              variant={backgroundColor === 'primary' ? 'secondary' : 'default'}
              asChild
            >
              <a href={primaryButtonLink}>{primaryButtonText}</a>
            </Button>
            {secondaryButtonText && (
              <Button
                size="lg"
                variant="outline"
                asChild
              >
                <a href={secondaryButtonLink}>{secondaryButtonText}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export const ctaBlockConfig: ComponentConfig<CTABlockProps> = {
  label: 'Call to Action',
  fields: {
    variant: {
      type: 'select',
      label: 'Layout',
      options: [
        { label: 'Simple Centered', value: 'simple' },
        { label: 'Split with Image', value: 'split' },
        { label: 'Banner', value: 'banner' },
      ],
    },
    headline: {
      type: 'text',
      label: 'Headline',
      contentEditable: true,
    },
    description: {
      type: 'textarea',
      label: 'Description',
      contentEditable: true,
    },
    primaryButtonText: {
      type: 'text',
      label: 'Primary Button Text',
      contentEditable: true,
    },
    primaryButtonLink: {
      type: 'text',
      label: 'Primary Button Link',
    },
    secondaryButtonText: {
      type: 'text',
      label: 'Secondary Button Text',
      contentEditable: true,
    },
    secondaryButtonLink: {
      type: 'text',
      label: 'Secondary Button Link',
    },
    backgroundColor: {
      type: 'select',
      label: 'Background Color',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Primary', value: 'primary' },
        { label: 'Muted', value: 'muted' },
      ],
    },
    image: {
      type: 'text',
      label: 'Image URL (for Split variant)',
    },
  },
  defaultProps: {
    variant: 'simple',
    headline: 'Ready to get started?',
    description: 'Join thousands of satisfied customers using our platform.',
    primaryButtonText: 'Get Started Free',
    primaryButtonLink: '#',
    secondaryButtonText: 'Contact Sales',
    secondaryButtonLink: '#',
    backgroundColor: 'muted',
  },
  render: (props) => <CTABlock {...props} />,
}
