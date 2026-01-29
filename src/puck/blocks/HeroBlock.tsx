'use client'

/**
 * Hero Block Component
 *
 * Configurable hero section with multiple layout variants.
 * Supports inline text editing for headline and subheadline.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

export interface HeroBlockProps {
  variant: 'centered' | 'split' | 'background-image'
  headline: string | ReactNode
  subheadline: string | ReactNode
  primaryButtonText: string | ReactNode
  primaryButtonLink: string
  secondaryButtonText?: string | ReactNode
  secondaryButtonLink?: string
  backgroundImage?: string
  alignment: 'left' | 'center' | 'right'
  textColor: 'light' | 'dark'
  overlayOpacity: number
  minHeight: string
}

export function HeroBlock({
  variant = 'centered',
  headline,
  subheadline,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  backgroundImage,
  alignment = 'center',
  textColor = 'dark',
  overlayOpacity = 50,
  minHeight = '500px',
}: HeroBlockProps) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  const textColorClasses = {
    light: 'text-white',
    dark: 'text-foreground',
  }

  if (variant === 'split') {
    return (
      <section className="py-16 lg:py-24" style={{ minHeight }}>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={cn('flex flex-col gap-6', alignmentClasses[alignment])}>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
                {headline}
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
                {subheadline}
              </p>
              <div className="flex flex-wrap gap-4">
                {primaryButtonText && (
                  <Button size="lg" asChild>
                    <a href={primaryButtonLink}>{primaryButtonText}</a>
                  </Button>
                )}
                {secondaryButtonText && (
                  <Button variant="outline" size="lg" asChild>
                    <a href={secondaryButtonLink}>{secondaryButtonText}</a>
                  </Button>
                )}
              </div>
            </div>
            {backgroundImage && (
              <div className="relative aspect-square lg:aspect-[4/3] rounded-lg overflow-hidden">
                <img
                  src={backgroundImage}
                  alt=""
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'background-image') {
    return (
      <section
        className="relative flex items-center justify-center"
        style={{ minHeight, backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
        <div className={cn('relative z-10 container mx-auto px-4 py-16', alignmentClasses[alignment])}>
          <div className={cn('flex flex-col gap-6 max-w-3xl', textColorClasses[textColor])}>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
              {headline}
            </h1>
            <p className="text-lg lg:text-xl opacity-90 max-w-xl">
              {subheadline}
            </p>
            <div className="flex flex-wrap gap-4">
              {primaryButtonText && (
                <Button size="lg" variant={textColor === 'light' ? 'secondary' : 'default'} asChild>
                  <a href={primaryButtonLink}>{primaryButtonText}</a>
                </Button>
              )}
              {secondaryButtonText && (
                <Button size="lg" variant="outline" className={textColor === 'light' ? 'border-white text-white hover:bg-white/10' : ''} asChild>
                  <a href={secondaryButtonLink}>{secondaryButtonText}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Default: centered
  return (
    <section className="py-16 lg:py-24" style={{ minHeight }}>
      <div className="container mx-auto px-4">
        <div className={cn('flex flex-col gap-6 max-w-3xl mx-auto', alignmentClasses[alignment])}>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
            {headline}
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground">
            {subheadline}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {primaryButtonText && (
              <Button size="lg" asChild>
                <a href={primaryButtonLink}>{primaryButtonText}</a>
              </Button>
            )}
            {secondaryButtonText && (
              <Button variant="outline" size="lg" asChild>
                <a href={secondaryButtonLink}>{secondaryButtonText}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export const heroBlockConfig: ComponentConfig<HeroBlockProps> = {
  label: 'Hero Section',
  fields: {
    variant: {
      type: 'select',
      label: 'Layout Variant',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Split (Image Right)', value: 'split' },
        { label: 'Background Image', value: 'background-image' },
      ],
    },
    headline: {
      type: 'textarea',
      label: 'Headline',
      contentEditable: true,
    },
    subheadline: {
      type: 'textarea',
      label: 'Subheadline',
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
    },
    secondaryButtonLink: {
      type: 'text',
      label: 'Secondary Button Link',
    },
    backgroundImage: {
      type: 'text',
      label: 'Background/Side Image URL',
    },
    alignment: {
      type: 'radio',
      label: 'Text Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    textColor: {
      type: 'radio',
      label: 'Text Color (for Background Image)',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
    },
    overlayOpacity: {
      type: 'number',
      label: 'Overlay Opacity (%)',
      min: 0,
      max: 100,
    },
    minHeight: {
      type: 'text',
      label: 'Minimum Height',
    },
  },
  defaultProps: {
    variant: 'centered',
    headline: 'Build something amazing',
    subheadline: 'Create stunning websites with our visual page builder. No coding required.',
    primaryButtonText: 'Get Started',
    primaryButtonLink: '#',
    secondaryButtonText: 'Learn More',
    secondaryButtonLink: '#',
    alignment: 'center',
    textColor: 'dark',
    overlayOpacity: 50,
    minHeight: '500px',
  },
  render: (props) => <HeroBlock {...props} />,
}
