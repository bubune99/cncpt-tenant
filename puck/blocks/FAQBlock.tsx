'use client'

/**
 * FAQ Block Component
 *
 * Display frequently asked questions with accordion.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import { cn } from '../../lib/utils'

interface FAQItem {
  question: string | ReactNode
  answer: string | ReactNode
}

export interface FAQBlockProps {
  headline: string | ReactNode
  subheadline: string | ReactNode
  variant: 'single' | 'two-column'
  items: FAQItem[]
}

export function FAQBlock({
  headline,
  subheadline,
  variant = 'single',
  items = [],
}: FAQBlockProps) {
  if (variant === 'two-column') {
    const midpoint = Math.ceil(items.length / 2)
    const leftColumn = items.slice(0, midpoint)
    const rightColumn = items.slice(midpoint)

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

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {leftColumn.map((item, index) => (
                <AccordionItem key={index} value={`left-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Accordion type="single" collapsible className="w-full">
              {rightColumn.map((item, index) => (
                <AccordionItem key={index} value={`right-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    )
  }

  // Single column layout
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

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

export const faqBlockConfig: ComponentConfig<FAQBlockProps> = {
  label: 'FAQ Section',
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
        { label: 'Single Column', value: 'single' },
        { label: 'Two Columns', value: 'two-column' },
      ],
    },
    items: {
      type: 'array',
      label: 'FAQ Items',
      arrayFields: {
        question: {
          type: 'text',
          label: 'Question',
          contentEditable: true,
        },
        answer: {
          type: 'textarea',
          label: 'Answer',
          contentEditable: true,
        },
      },
      defaultItemProps: {
        question: 'What is your refund policy?',
        answer: 'We offer a 30-day money-back guarantee.',
      },
      getItemSummary: (item: FAQItem) => item.question || 'Question',
    },
  },
  defaultProps: {
    headline: 'Frequently Asked Questions',
    subheadline: 'Find answers to common questions about our product.',
    variant: 'single',
    items: [
      {
        question: 'How do I get started?',
        answer: 'Getting started is easy! Simply sign up for an account and follow our onboarding guide. Our setup wizard will walk you through the initial configuration.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual subscriptions.',
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
      },
      {
        question: 'Do you offer a free trial?',
        answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.',
      },
    ],
  },
  render: (props) => <FAQBlock {...props} />,
}
