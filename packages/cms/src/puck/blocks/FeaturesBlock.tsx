'use client'

/**
 * Features Block Component
 *
 * Display features in a grid layout with icons.
 */

import React, { ReactNode } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import {
  Zap, Shield, Globe, Rocket, Star, Heart,
  Settings, Users, Clock, CheckCircle, Award, Lightbulb
} from 'lucide-react'

const iconMap = {
  zap: Zap,
  shield: Shield,
  globe: Globe,
  rocket: Rocket,
  star: Star,
  heart: Heart,
  settings: Settings,
  users: Users,
  clock: Clock,
  check: CheckCircle,
  award: Award,
  lightbulb: Lightbulb,
}

type IconName = keyof typeof iconMap

interface Feature {
  icon: IconName
  title: string | ReactNode
  description: string | ReactNode
}

export interface FeaturesBlockProps {
  headline: string | ReactNode
  subheadline: string | ReactNode
  columns: 2 | 3 | 4
  variant: 'cards' | 'simple' | 'centered'
  features: Feature[]
}

export function FeaturesBlock({
  headline,
  subheadline,
  columns = 3,
  variant = 'cards',
  features = [],
}: FeaturesBlockProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
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

        {/* Features Grid */}
        <div className={cn('grid gap-6', gridCols[columns])}>
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Zap

            if (variant === 'cards') {
              return (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            }

            if (variant === 'centered') {
              return (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            }

            // Simple variant
            return (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export const featuresBlockConfig: ComponentConfig<FeaturesBlockProps> = {
  label: 'Features Grid',
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
    columns: {
      type: 'select',
      label: 'Columns',
      options: [
        { label: '2 Columns', value: 2 },
        { label: '3 Columns', value: 3 },
        { label: '4 Columns', value: 4 },
      ],
    },
    variant: {
      type: 'select',
      label: 'Style Variant',
      options: [
        { label: 'Cards', value: 'cards' },
        { label: 'Simple', value: 'simple' },
        { label: 'Centered', value: 'centered' },
      ],
    },
    features: {
      type: 'array',
      label: 'Features',
      arrayFields: {
        icon: {
          type: 'select',
          label: 'Icon',
          options: [
            { label: 'Zap', value: 'zap' },
            { label: 'Shield', value: 'shield' },
            { label: 'Globe', value: 'globe' },
            { label: 'Rocket', value: 'rocket' },
            { label: 'Star', value: 'star' },
            { label: 'Heart', value: 'heart' },
            { label: 'Settings', value: 'settings' },
            { label: 'Users', value: 'users' },
            { label: 'Clock', value: 'clock' },
            { label: 'Check', value: 'check' },
            { label: 'Award', value: 'award' },
            { label: 'Lightbulb', value: 'lightbulb' },
          ],
        },
        title: {
          type: 'text',
          label: 'Title',
          contentEditable: true,
        },
        description: {
          type: 'textarea',
          label: 'Description',
          contentEditable: true,
        },
      },
      defaultItemProps: {
        icon: 'zap',
        title: 'Feature Title',
        description: 'Feature description goes here.',
      },
    },
  },
  defaultProps: {
    headline: 'Everything you need',
    subheadline: 'Our platform provides all the tools you need to succeed.',
    columns: 3,
    variant: 'cards',
    features: [
      { icon: 'zap', title: 'Lightning Fast', description: 'Optimized for speed and performance.' },
      { icon: 'shield', title: 'Secure by Default', description: 'Enterprise-grade security built in.' },
      { icon: 'globe', title: 'Global Scale', description: 'Deploy anywhere in the world.' },
    ],
  },
  render: (props) => <FeaturesBlock {...props} />,
}
