'use client'

/**
 * Pricing Block Component
 *
 * Display pricing tiers in a comparison layout.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

interface PricingTier {
  name: string | ReactNode
  description: string | ReactNode
  price: string | ReactNode
  period: string | ReactNode
  features: string[]
  buttonText: string | ReactNode
  buttonLink: string
  highlighted: boolean
  badge?: string | ReactNode
}

export interface PricingBlockProps {
  headline: string | ReactNode
  subheadline: string | ReactNode
  tiers: PricingTier[]
}

export function PricingBlock({
  headline,
  subheadline,
  tiers = [],
}: PricingBlockProps) {
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

        {/* Pricing Grid */}
        <div className={cn(
          'grid gap-6 max-w-5xl mx-auto',
          tiers.length === 2 && 'md:grid-cols-2',
          tiers.length >= 3 && 'md:grid-cols-2 lg:grid-cols-3'
        )}>
          {tiers.map((tier, index) => (
            <Card
              key={index}
              className={cn(
                'relative h-full flex flex-col',
                tier.highlighted && 'border-primary shadow-lg scale-105'
              )}
            >
              {tier.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {tier.badge}
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/{tier.period}</span>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <a href={tier.buttonLink}>{tier.buttonText}</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export const pricingBlockConfig: ComponentConfig<PricingBlockProps> = {
  label: 'Pricing Table',
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
    tiers: {
      type: 'array',
      label: 'Pricing Tiers',
      arrayFields: {
        name: {
          type: 'text',
          label: 'Tier Name',
          contentEditable: true,
        },
        description: {
          type: 'text',
          label: 'Description',
          contentEditable: true,
        },
        price: {
          type: 'text',
          label: 'Price',
          contentEditable: true,
        },
        period: {
          type: 'text',
          label: 'Period (e.g., month, year)',
          contentEditable: true,
        },
        features: {
          type: 'array',
          label: 'Features',
          arrayFields: {
            value: {
              type: 'text',
              label: 'Feature',
            },
          },
          getItemSummary: (item: { value: string }) => item.value || 'Feature',
        },
        buttonText: {
          type: 'text',
          label: 'Button Text',
          contentEditable: true,
        },
        buttonLink: {
          type: 'text',
          label: 'Button Link',
        },
        highlighted: {
          type: 'radio',
          label: 'Highlighted (Popular)',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        badge: {
          type: 'text',
          label: 'Badge Text (optional)',
          contentEditable: true,
        },
      },
      defaultItemProps: {
        name: 'Basic',
        description: 'For individuals',
        price: '$9',
        period: 'month',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        buttonText: 'Get Started',
        buttonLink: '#',
        highlighted: false,
      },
      getItemSummary: (item: PricingTier) => item.name || 'Tier',
    },
  },
  defaultProps: {
    headline: 'Simple, transparent pricing',
    subheadline: 'Choose the plan that\'s right for you.',
    tiers: [
      {
        name: 'Starter',
        description: 'For individuals',
        price: '$9',
        period: 'month',
        features: ['Up to 5 projects', 'Basic analytics', 'Email support'],
        buttonText: 'Start Free Trial',
        buttonLink: '#',
        highlighted: false,
      },
      {
        name: 'Pro',
        description: 'For growing teams',
        price: '$29',
        period: 'month',
        features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Team collaboration'],
        buttonText: 'Get Started',
        buttonLink: '#',
        highlighted: true,
        badge: 'Most Popular',
      },
      {
        name: 'Enterprise',
        description: 'For large organizations',
        price: '$99',
        period: 'month',
        features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
        buttonText: 'Contact Sales',
        buttonLink: '#',
        highlighted: false,
      },
    ],
  },
  render: (props) => <PricingBlock {...props} />,
}
