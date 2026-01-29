'use client'

/**
 * Walkthrough Provider
 *
 * Provides Joyride walkthrough functionality.
 * Wrap this inside HelpProvider to enable guided tours.
 */

import React, { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useHelp } from './help-provider'
import type { HelpTour, JoyrideStep } from './types'

// Dynamic import Joyride to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Joyride = dynamic(() => import('react-joyride'), { ssr: false }) as React.ComponentType<any>

// Burnt orange theme
const ACCENT_COLOR = '#C26A3A'

// Custom styles for Joyride
const joyrideStyles = {
  options: {
    arrowColor: '#ffffff',
    backgroundColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: ACCENT_COLOR,
    spotlightShadow: `0 0 15px ${ACCENT_COLOR}`,
    textColor: '#1e293b',
    width: 380,
    zIndex: 10000,
  },
  buttonNext: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 500,
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#64748b',
    fontSize: 14,
    marginRight: 8,
  },
  buttonSkip: {
    color: '#94a3b8',
    fontSize: 14,
  },
  buttonClose: {
    color: '#94a3b8',
  },
  tooltip: {
    borderRadius: 8,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: 0,
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipContent: {
    padding: '16px 20px',
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
    color: '#0f172a',
  },
  tooltipFooter: {
    borderTop: '1px solid #e2e8f0',
    marginTop: 0,
    padding: '12px 20px',
  },
  spotlight: {
    borderRadius: 8,
  },
  beacon: {
    display: 'none', // Hide beacon, we use direct triggering
  },
}

// Joyride callback data type
interface JoyrideCallbackData {
  action: string
  index: number
  status: string
  type: string
}

interface WalkthroughProviderProps {
  children?: React.ReactNode
}

export function WalkthroughProvider({ children }: WalkthroughProviderProps) {
  const { isWalkthroughActive, stopWalkthrough, availableTours } = useHelp()
  const [currentTour, setCurrentTour] = useState<HelpTour | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [run, setRun] = useState(false)

  // Load tour when walkthrough starts
  useEffect(() => {
    if (isWalkthroughActive && availableTours.length > 0 && !currentTour) {
      // Start with first available tour (can be enhanced to accept tour slug)
      const tour = availableTours[0]
      setCurrentTour(tour)
      setStepIndex(0)
      setRun(true)
    } else if (!isWalkthroughActive) {
      setRun(false)
      setCurrentTour(null)
      setStepIndex(0)
    }
  }, [isWalkthroughActive, availableTours, currentTour])

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback(
    (data: JoyrideCallbackData) => {
      const { action, index, status, type } = data
      const finishedStatuses: string[] = ['finished', 'skipped']

      if (finishedStatuses.includes(status)) {
        // Mark tour as completed
        if (currentTour && status === 'finished') {
          fetch('/api/help/tours', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentTour.id,
              markCompleted: true,
            }),
          }).catch(console.error)
        }

        setRun(false)
        stopWalkthrough()
        return
      }

      if (type === 'step:after') {
        // Move to next step
        setStepIndex(index + (action === 'prev' ? -1 : 1))
      }
    },
    [currentTour, stopWalkthrough]
  )

  // Convert tour steps to Joyride format
  const steps: JoyrideStep[] = currentTour?.steps
    ? currentTour.steps.map((step) => ({
        ...step,
        disableBeacon: true,
      }))
    : []

  return (
    <>
      {children}

      {currentTour && (
        <Joyride
          callback={handleJoyrideCallback}
          continuous
          run={run}
          scrollToFirstStep
          showProgress
          showSkipButton
          stepIndex={stepIndex}
          steps={steps}
          styles={joyrideStyles}
          locale={{
            back: 'Back',
            close: 'Close',
            last: 'Done',
            next: 'Next',
            open: 'Open',
            skip: 'Skip tour',
          }}
          floaterProps={{
            disableAnimation: false,
          }}
          {...(currentTour.options || {})}
        />
      )}
    </>
  )
}

/**
 * Hook to programmatically control walkthroughs
 */
export function useWalkthrough() {
  const { startWalkthrough, stopWalkthrough, isWalkthroughActive, availableTours } = useHelp()

  const startTour = useCallback(
    (tourSlug?: string) => {
      startWalkthrough(tourSlug)
    },
    [startWalkthrough]
  )

  const endTour = useCallback(() => {
    stopWalkthrough()
  }, [stopWalkthrough])

  return {
    startTour,
    endTour,
    isActive: isWalkthroughActive,
    availableTours,
  }
}
