'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/cms/utils';

export type CompositionSegmentColor =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

export interface CompositionSegment {
  label: string;
  value: number;
  color: CompositionSegmentColor;
}

export interface CompositionBarCardProps {
  label: string;
  total: number;
  segments: CompositionSegment[];
  /** Big number + caption rendered on the right of the header (e.g. "61% Available") */
  headlineMetric?: {
    value: string;
    subtitle: string;
  };
  className?: string;
  tourId?: string;
  helpKey?: string;
}

/** Pure: tailwind class for a colored bar segment. Uses brand tokens. */
function segmentBarClass(color: CompositionSegmentColor): string {
  switch (color) {
    case 'success':
      return 'bg-green-500 dark:bg-green-600';
    case 'warning':
      return 'bg-amber-500 dark:bg-amber-600';
    case 'destructive':
      return 'bg-red-500 dark:bg-red-600';
    case 'muted':
    default:
      return 'bg-muted-foreground/40';
  }
}

/** Pure: tailwind text class for a segment legend dot. */
function segmentDotClass(color: CompositionSegmentColor): string {
  switch (color) {
    case 'success':
      return 'bg-green-500 dark:bg-green-500';
    case 'warning':
      return 'bg-amber-500 dark:bg-amber-500';
    case 'destructive':
      return 'bg-red-500 dark:bg-red-500';
    case 'muted':
    default:
      return 'bg-muted-foreground/50';
  }
}

/** Pure: percentage width as a string ("12.5%"). */
function pctWidth(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
}

/**
 * Card showing a single composition (a total broken into colored segments)
 * with an optional headline metric to the right. Renders a stacked bar plus
 * a per-segment legend with counts.
 */
export function CompositionBarCard({
  label,
  total,
  segments,
  headlineMetric,
  className,
  tourId,
  helpKey,
}: CompositionBarCardProps) {
  const safeSegments = segments.filter((s) => s.value >= 0);
  const sumSegments = safeSegments.reduce((s, seg) => s + seg.value, 0);
  // If total is provided but doesn't match segment sum, trust segment sum
  // to keep the bar honest.
  const effectiveTotal = total > 0 ? Math.max(total, sumSegments) : sumSegments;

  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-tour-id={tourId}
      data-help-key={helpKey}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 p-4 sm:p-6 sm:pb-4">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            {effectiveTotal.toLocaleString()}
          </p>
        </div>
        {headlineMetric ? (
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold tracking-tight">
              {headlineMetric.value}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {headlineMetric.subtitle}
            </p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {/* Stacked bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
          {effectiveTotal > 0
            ? safeSegments.map((seg, i) => (
                <div
                  key={`${seg.label}-${i}`}
                  className={cn(
                    'h-full transition-all',
                    segmentBarClass(seg.color),
                  )}
                  style={{ width: pctWidth(seg.value, effectiveTotal) }}
                  aria-label={`${seg.label}: ${seg.value}`}
                />
              ))
            : null}
        </div>
        {/* Legend */}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {safeSegments.map((seg) => (
            <li
              key={seg.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full inline-block',
                    segmentDotClass(seg.color),
                  )}
                />
                {seg.label}
              </span>
              <span className="font-medium tabular-nums">
                {seg.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
