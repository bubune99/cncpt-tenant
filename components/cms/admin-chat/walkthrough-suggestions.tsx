'use client'

/**
 * Walkthrough Suggestions Component
 *
 * Renders AI-suggested walkthroughs as clickable cards in the chat interface.
 * When clicked, triggers the walkthrough or generates a new one on-the-fly.
 */

import React from 'react'
import { BookOpen, Sparkles, ChevronRight, Clock, BarChart } from 'lucide-react'
import { useWalkthrough } from '../help-system/walkthrough-provider'

// Types for walkthrough suggestions from AI
export interface WalkthroughSuggestion {
  id: string
  title: string
  description: string
  estimatedSteps: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tourSlug?: string
  actionType: 'start_existing' | 'generate_new'
}

export interface WalkthroughSuggestionsData {
  action: 'suggest_walkthroughs'
  context: string
  suggestions: WalkthroughSuggestion[]
  message: string
}

interface WalkthroughSuggestionsProps {
  data: WalkthroughSuggestionsData
  onStartTour?: (tourSlug: string) => void
  onGenerateTour?: (suggestionId: string) => void
}

// Difficulty badge colors
const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
  advanced: 'bg-red-100 text-red-700 border-red-200',
}

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function WalkthroughSuggestions({
  data,
  onStartTour,
  onGenerateTour,
}: WalkthroughSuggestionsProps) {
  const { startTour } = useWalkthrough()

  const handleClick = (suggestion: WalkthroughSuggestion) => {
    if (suggestion.tourSlug && suggestion.actionType === 'start_existing') {
      // Start an existing tour
      if (onStartTour) {
        onStartTour(suggestion.tourSlug)
      } else {
        startTour(suggestion.tourSlug)
      }
    } else {
      // Request AI to generate a new tour
      if (onGenerateTour) {
        onGenerateTour(suggestion.id)
      }
    }
  }

  return (
    <div className="my-3 space-y-3">
      {/* Header message */}
      <p className="text-sm text-slate-600">{data.message}</p>

      {/* Suggestion cards */}
      <div className="grid gap-2">
        {data.suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => handleClick(suggestion)}
            className="group w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:border-[#C26A3A] hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#C26A3A]/10 flex items-center justify-center group-hover:bg-[#C26A3A]/20 transition-colors">
                {suggestion.actionType === 'generate_new' ? (
                  <Sparkles className="w-5 h-5 text-[#C26A3A]" />
                ) : (
                  <BookOpen className="w-5 h-5 text-[#C26A3A]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 truncate">
                    {suggestion.title}
                  </h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#C26A3A] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                  {suggestion.description}
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-3 text-xs">
                  {/* Difficulty badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full border ${difficultyColors[suggestion.difficulty]}`}
                  >
                    {difficultyLabels[suggestion.difficulty]}
                  </span>

                  {/* Steps count */}
                  <span className="flex items-center gap-1 text-slate-500">
                    <BarChart className="w-3 h-3" />
                    {suggestion.estimatedSteps} steps
                  </span>

                  {/* Generate indicator */}
                  {suggestion.actionType === 'generate_new' && (
                    <span className="flex items-center gap-1 text-[#C26A3A]">
                      <Sparkles className="w-3 h-3" />
                      Custom
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Help text */}
      <p className="text-xs text-slate-400">
        Click a walkthrough to start learning. Custom tours are generated just for you.
      </p>
    </div>
  )
}

/**
 * Walkthrough Started Component
 *
 * Displays when the AI starts a walkthrough for the user.
 */
export interface WalkthroughStartedData {
  action: 'start_walkthrough'
  tourId: string
  tourSlug: string
  title: string
  stepsCount: number
  navigateTo?: string
  message: string
}

interface WalkthroughStartedProps {
  data: WalkthroughStartedData
}

export function WalkthroughStarted({ data }: WalkthroughStartedProps) {
  return (
    <div className="my-3 p-4 bg-[#C26A3A]/5 border border-[#C26A3A]/20 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#C26A3A]/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#C26A3A]" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900">{data.title}</h4>
          <p className="text-sm text-slate-600">
            {data.stepsCount} steps • {data.message}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Element Explanation Component
 *
 * Displays when the AI explains a UI element.
 */
export interface ElementExplanationData {
  action: 'explain_element'
  elementKey: string
  explanation: string
  savedAsHelp?: boolean
  relatedTour?: {
    slug: string
    title: string
    message: string
  }
}

interface ElementExplanationProps {
  data: ElementExplanationData
  onStartTour?: (tourSlug: string) => void
}

export function ElementExplanation({
  data,
  onStartTour,
}: ElementExplanationProps) {
  const { startTour } = useWalkthrough()

  const handleTourClick = () => {
    if (data.relatedTour) {
      if (onStartTour) {
        onStartTour(data.relatedTour.slug)
      } else {
        startTour(data.relatedTour.slug)
      }
    }
  }

  return (
    <div className="my-3 space-y-3">
      {/* Explanation */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-700">{data.explanation}</p>
        {data.savedAsHelp && (
          <p className="mt-2 text-xs text-green-600">
            ✓ Saved to help content
          </p>
        )}
      </div>

      {/* Related tour suggestion */}
      {data.relatedTour && (
        <button
          onClick={handleTourClick}
          className="w-full p-3 bg-white border border-slate-200 rounded-lg hover:border-[#C26A3A] hover:shadow-sm transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#C26A3A]" />
            <span className="text-sm text-slate-700">
              {data.relatedTour.message}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </div>
        </button>
      )}
    </div>
  )
}
