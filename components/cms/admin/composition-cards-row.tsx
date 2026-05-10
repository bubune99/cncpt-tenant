'use client';

import { useEffect, useState } from 'react';
import {
  CompositionBarCard,
  type CompositionSegment,
} from './composition-bar-card';
import { Card, CardContent, CardHeader } from '../ui/card';
import { cn } from '@/lib/cms/utils';

interface CompositionShape {
  label: string;
  total: number;
  segments: CompositionSegment[];
  headlineMetric?: {
    value: string;
    subtitle: string;
  };
}

interface CompositionResponse {
  generatedAt: string;
  compositions: {
    orderPipeline: CompositionShape;
    productCatalog: CompositionShape;
  };
}

export interface CompositionCardsRowProps {
  className?: string;
}

function SkeletonComposition() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 p-4 sm:p-6 sm:pb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-7 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-7 w-16 bg-muted rounded animate-pulse ml-auto" />
          <div className="h-3 w-14 bg-muted rounded animate-pulse ml-auto" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="h-2.5 w-full rounded-full bg-muted animate-pulse" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-full bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Renders the two-up composition card row underneath the KPI strip.
 * Data is fetched once on mount; the compositions are not timeframe-bound
 * since they represent current-state catalog + pipeline.
 */
export function CompositionCardsRow({ className }: CompositionCardsRowProps) {
  const [data, setData] = useState<CompositionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/cms/admin/dashboard/composition')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: CompositionResponse | null) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const gridClass = cn(
    'grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2',
    className,
  );

  if (loading) {
    return (
      <div className={gridClass} data-tour-id="dashboard-composition">
        <SkeletonComposition />
        <SkeletonComposition />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { orderPipeline, productCatalog } = data.compositions;

  return (
    <div className={gridClass} data-tour-id="dashboard-composition">
      <CompositionBarCard
        label={orderPipeline.label}
        total={orderPipeline.total}
        segments={orderPipeline.segments}
        headlineMetric={orderPipeline.headlineMetric}
        tourId="composition-orders"
        helpKey="admin.dashboard.composition.orders"
      />
      <CompositionBarCard
        label={productCatalog.label}
        total={productCatalog.total}
        segments={productCatalog.segments}
        headlineMetric={productCatalog.headlineMetric}
        tourId="composition-products"
        helpKey="admin.dashboard.composition.products"
      />
    </div>
  );
}
