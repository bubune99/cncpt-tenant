/**
 * Atlas Customer Tracking Timeline
 * Horizontal 5-step progress with pulsing current step.
 * Uses --wl-* tokens exclusively.
 */

import type { TrackingStep } from './types';

interface TrackingTimelineProps {
  readonly steps: readonly TrackingStep[];
}

export function TrackingTimeline({ steps }: TrackingTimelineProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
        gap: 0,
        position: 'relative',
        marginTop: 14,
      }}
    >
      {steps.map((step, idx) => {
        const isDone   = step.state === 'done';
        const isNow    = step.state === 'now';
        const isFuture = step.state === 'future';
        const isLast   = idx === steps.length - 1;

        return (
          <div
            key={step.key}
            style={{
              textAlign: 'center',
              position: 'relative',
              paddingTop: 22,
            }}
          >
            {/* Connector line */}
            {!isLast && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 6,
                  left: '50%',
                  right: '-50%',
                  height: 2,
                  background: isDone || isNow ? 'var(--wl-success)' : 'var(--wl-rule)',
                  zIndex: 1,
                }}
              />
            )}

            {/* Ring */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: isDone ? 'var(--wl-success)' : isNow ? 'var(--wl-accent)' : 'var(--wl-bg)',
                border: `2px solid ${isDone ? 'var(--wl-success)' : isNow ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
                boxShadow: isNow ? '0 0 0 4px var(--wl-accent-soft)' : 'none',
                zIndex: 2,
              }}
            />

            {/* Label */}
            <div
              style={{
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 10,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: isFuture ? 'var(--wl-text-faint)' : 'var(--wl-text)',
                fontWeight: isDone || isNow ? 600 : 400,
                marginBottom: 2,
              }}
            >
              {step.label}
            </div>
            <div
              style={{
                fontFamily: isDone || isNow ? 'var(--wl-font-mono)' : "'Spectral', serif",
                fontStyle: isFuture ? 'italic' : 'normal',
                fontSize: isDone || isNow ? 11 : 12,
                color: isFuture ? 'var(--wl-text-faint)' : 'var(--wl-text-soft)',
              }}
            >
              {step.when}
            </div>
          </div>
        );
      })}
    </div>
  );
}
