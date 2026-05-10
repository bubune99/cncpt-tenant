'use client';

import * as React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/cms/utils';

export interface KpiDelta {
  /** Magnitude of change, e.g. 15.8 for "+15.8%" */
  value: number;
  direction: 'up' | 'down' | 'flat';
  /** Comparison label, e.g. "vs last week" */
  context: string;
}

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: KpiDelta;
  /** Optional smaller line shown below the delta (e.g. "12 low stock") */
  secondary?: string;
  /**
   * For metrics where "up" means bad (e.g. Returns, Refunds, Cancellations).
   * Flips the color polarity so red = up, green = down.
   */
  inversePolarity?: boolean;
  /** Optional Lucide icon shown in the top-right corner */
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  /** data-tour-id for spotlight tours */
  tourId?: string;
  /** data-help-key for the help system */
  helpKey?: string;
}

/**
 * Pure formatting — no business logic. Returns the tailwind class for the
 * delta text based on direction + polarity.
 */
function deltaColorClass(direction: KpiDelta['direction'], inverse: boolean): string {
  if (direction === 'flat') return 'text-muted-foreground';
  const isPositive = inverse ? direction === 'down' : direction === 'up';
  return isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
}

function deltaIcon(direction: KpiDelta['direction']) {
  if (direction === 'up') return ArrowUpRight;
  if (direction === 'down') return ArrowDownRight;
  return Minus;
}

function formatDeltaValue(delta: KpiDelta): string {
  if (delta.direction === 'flat') return '0%';
  const sign = delta.direction === 'up' ? '+' : '-';
  const abs = Math.abs(delta.value);
  return `${sign}${abs.toFixed(1)}%`;
}

export function KpiCard({
  label,
  value,
  delta,
  secondary,
  inversePolarity = false,
  icon: Icon,
  className,
  tourId,
  helpKey,
}: KpiCardProps) {
  const colorClass = delta ? deltaColorClass(delta.direction, inversePolarity) : '';
  const DeltaIcon = delta ? deltaIcon(delta.direction) : null;

  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-tour-id={tourId}
      data-help-key={helpKey}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">
          {value}
        </div>
        {delta ? (
          <div className={cn('flex items-center gap-1 text-xs mt-2', colorClass)}>
            {DeltaIcon ? <DeltaIcon className="h-3.5 w-3.5" /> : null}
            <span className="font-medium">{formatDeltaValue(delta)}</span>
            <span className="text-muted-foreground font-normal">
              {delta.context}
            </span>
          </div>
        ) : null}
        {secondary ? (
          <p className="text-xs text-muted-foreground mt-1">{secondary}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
