'use client'

import React, { useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { HelpTour } from './types'

const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

interface JoyrideRunnerProps {
  tour: HelpTour
  onComplete: () => void
  onSkip: () => void
}

const STATUS_FINISHED = 'finished' as const
const STATUS_SKIPPED = 'skipped' as const

const defaultStyles = {
  options: {
    arrowColor: '#1e1e2e',
    backgroundColor: '#1e1e2e',
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    primaryColor: '#6366f1',
    textColor: '#e2e8f0',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '0.75rem',
    padding: '1rem',
    fontSize: '0.875rem',
  },
  buttonNext: {
    backgroundColor: '#6366f1',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.8125rem',
    padding: '0.5rem 1rem',
  },
  buttonBack: {
    color: '#94a3b8',
    fontSize: '0.8125rem',
    marginRight: '0.5rem',
  },
  buttonSkip: {
    color: '#64748b',
    fontSize: '0.8125rem',
  },
  buttonClose: {
    color: '#94a3b8',
  },
}

export function JoyrideRunner({ tour, onComplete, onSkip }: JoyrideRunnerProps) {
  const steps = useMemo(() => {
    return tour.steps.map((step) => ({
      ...step,
      disableBeacon: step.disableBeacon ?? true,
    }))
  }, [tour.steps])

  const styles = useMemo(() => {
    const tourStyles = tour.options?.styles
    if (!tourStyles) return defaultStyles

    return {
      options: { ...defaultStyles.options, ...tourStyles.options },
      tooltip: { ...defaultStyles.tooltip, ...tourStyles.tooltip },
      buttonNext: { ...defaultStyles.buttonNext, ...tourStyles.buttonNext },
      buttonBack: { ...defaultStyles.buttonBack, ...tourStyles.buttonBack },
      buttonSkip: { ...defaultStyles.buttonSkip, ...tourStyles.buttonSkip },
      buttonClose: { ...defaultStyles.buttonClose, ...tourStyles.buttonClose },
    }
  }, [tour.options?.styles])

  const handleCallback = useCallback(
    (data: { status: string }) => {
      if (data.status === STATUS_FINISHED) {
        onComplete()
      } else if (data.status === STATUS_SKIPPED) {
        onSkip()
      }
    },
    [onComplete, onSkip]
  )

  return (
    <Joyride
      steps={steps}
      run={true}
      continuous={tour.options?.continuous ?? true}
      showProgress={tour.options?.showProgress ?? true}
      showSkipButton={tour.options?.showSkipButton ?? true}
      disableOverlayClose={tour.options?.disableOverlayClose ?? false}
      spotlightClicks={tour.options?.spotlightClicks ?? false}
      scrollToFirstStep={tour.options?.scrollToFirstStep ?? true}
      callback={handleCallback}
      styles={styles}
    />
  )
}
