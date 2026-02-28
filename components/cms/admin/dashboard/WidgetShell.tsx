'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { GripVertical, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../ui/skeleton';

interface WidgetShellProps {
  title: string;
  editing?: boolean;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function WidgetShell({
  title,
  editing,
  loading,
  error,
  onRefresh,
  children,
  className,
  noPadding,
}: WidgetShellProps) {
  return (
    <Card className={`h-full flex flex-col overflow-hidden ${className ?? ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-3">
        <div className="flex items-center gap-2">
          {editing && (
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          )}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        {onRefresh && !loading && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className={`flex-1 ${noPadding ? 'p-0' : 'px-4 pb-3'} overflow-auto`}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-4">
            <AlertCircle className="h-8 w-8" />
            <p className="text-xs text-center">{error}</p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Retry
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
