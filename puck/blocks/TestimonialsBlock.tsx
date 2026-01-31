'use client'

/**
 * Testimonials Block Component
 *
 * Display customer testimonials in various layouts.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Card, CardContent } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { cn } from '../../lib/utils'
import { Quote } from 'lucide-react'

interface Testimonial {
  quote: string | ReactNode
  author: string | ReactNode
  role: string | ReactNode
  company: string | ReactNode
  avatar?: string
  rating?: number
}

export interface TestimonialsBlockProps {
  headline: string | ReactNode
  subheadline: string | ReactNode
  variant: 'cards' | 'carousel' | 'featured'
  columns: 1 | 2 | 3
  showRating: boolean
  testimonials: Testimonial[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            'w-5 h-5',
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialsBlock({
  headline,
  subheadline,
  variant = 'cards',
  columns = 3,
  showRating = true,
  testimonials = [],
}: TestimonialsBlockProps) {
  const gridCols = {
    1: 'max-w-2xl mx-auto',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
  }

  if (variant === 'featured' && testimonials.length > 0) {
    const featured = testimonials[0]
    return (
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Quote className="w-12 h-12 text-primary mx-auto mb-6" />
            <blockquote className="text-2xl lg:text-3xl font-medium mb-8">
              "{featured.quote}"
            </blockquote>
            {showRating && featured.rating && (
              <div className="flex justify-center mb-6">
                <StarRating rating={featured.rating} />
              </div>
            )}
            <div className="flex items-center justify-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={featured.avatar} />
                <AvatarFallback>{typeof featured.author === 'string' ? featured.author.slice(0, 2).toUpperCase() : 'T'}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold">{featured.author}</div>
                <div className="text-muted-foreground">
                  {featured.role}, {featured.company}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            {headline}
          </h2>
          <p className="text-lg text-muted-foreground">
            {subheadline}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className={cn('grid gap-6', gridCols[columns])}>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="pt-6">
                {showRating && testimonial.rating && (
                  <div className="mb-4">
                    <StarRating rating={testimonial.rating} />
                  </div>
                )}
                <blockquote className="text-lg mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>
                      {typeof testimonial.author === 'string' ? testimonial.author.slice(0, 2).toUpperCase() : 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export const testimonialsBlockConfig: ComponentConfig<TestimonialsBlockProps> = {
  label: 'Testimonials',
  fields: {
    headline: {
      type: 'text',
      label: 'Headline',
      contentEditable: true,
    },
    subheadline: {
      type: 'textarea',
      label: 'Subheadline',
      contentEditable: true,
    },
    variant: {
      type: 'select',
      label: 'Layout',
      options: [
        { label: 'Cards Grid', value: 'cards' },
        { label: 'Featured Single', value: 'featured' },
      ],
    },
    columns: {
      type: 'select',
      label: 'Columns',
      options: [
        { label: '1 Column', value: 1 },
        { label: '2 Columns', value: 2 },
        { label: '3 Columns', value: 3 },
      ],
    },
    showRating: {
      type: 'radio',
      label: 'Show Star Rating',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    testimonials: {
      type: 'array',
      label: 'Testimonials',
      arrayFields: {
        quote: {
          type: 'textarea',
          label: 'Quote',
          contentEditable: true,
        },
        author: {
          type: 'text',
          label: 'Author Name',
          contentEditable: true,
        },
        role: {
          type: 'text',
          label: 'Role/Title',
          contentEditable: true,
        },
        company: {
          type: 'text',
          label: 'Company',
          contentEditable: true,
        },
        avatar: {
          type: 'text',
          label: 'Avatar URL',
        },
        rating: {
          type: 'number',
          label: 'Rating (1-5)',
          min: 1,
          max: 5,
        },
      },
      defaultItemProps: {
        quote: 'This product has transformed our workflow.',
        author: 'John Doe',
        role: 'CEO',
        company: 'Acme Inc',
        rating: 5,
      },
    },
  },
  defaultProps: {
    headline: 'What our customers say',
    subheadline: 'Hear from the people who use our platform every day.',
    variant: 'cards',
    columns: 3,
    showRating: true,
    testimonials: [
      {
        quote: 'This platform has completely transformed how we work. Highly recommended!',
        author: 'Sarah Johnson',
        role: 'Marketing Director',
        company: 'TechCorp',
        rating: 5,
      },
      {
        quote: 'The best investment we\'ve made for our business this year.',
        author: 'Michael Chen',
        role: 'Founder',
        company: 'StartupXYZ',
        rating: 5,
      },
      {
        quote: 'Incredible support team and amazing features. Love it!',
        author: 'Emily Davis',
        role: 'Product Manager',
        company: 'InnovateCo',
        rating: 5,
      },
    ],
  },
  render: (props) => <TestimonialsBlock {...props} />,
}
