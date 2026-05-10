'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar, Globe } from 'lucide-react';
import { cn } from '@/lib/cms/utils';

export const TIMEFRAME_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: 'month', label: 'This month' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: 'This year' },
] as const;

export type TimeframeValue = (typeof TIMEFRAME_OPTIONS)[number]['value'];

interface SubdomainOption {
  id: string | number;
  subdomain: string;
}

export interface DashboardFiltersProps {
  timeframe: TimeframeValue;
  onTimeframeChange: (value: TimeframeValue) => void;
  className?: string;
}

/**
 * Page-level filters bar for the admin dashboard.
 *
 * - Timeframe switcher: required, controls KPI/chart queries
 * - Site switcher: hidden unless the user owns multiple subdomains;
 *   navigating switches the entire admin context to the chosen subdomain
 */
export function DashboardFilters({
  timeframe,
  onTimeframeChange,
  className,
}: DashboardFiltersProps) {
  const params = useParams();
  const currentSubdomain = (params?.subdomain as string) || '';
  const [otherSubdomains, setOtherSubdomains] = useState<SubdomainOption[]>([]);
  const [siteSelectorLoading, setSiteSelectorLoading] = useState(true);

  // Probe whether the user has multiple sites; only render the picker when so.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/subdomain')
      .then((res) => (res.ok ? res.json() : { subdomains: [] }))
      .then((data: { subdomains?: SubdomainOption[] }) => {
        if (cancelled) return;
        const list = data.subdomains || [];
        setOtherSubdomains(list);
        setSiteSelectorLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setOtherSubdomains([]);
        setSiteSelectorLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasMultipleSites = otherSubdomains.length > 1;

  const handleSiteChange = (value: string) => {
    if (!value || value === currentSubdomain) return;
    // Hard-navigate so the subdomain in the URL changes and middleware
    // re-resolves the tenant context fresh.
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      // host may look like `current.cncptweb.com` or `cncptweb.com` in dev.
      const parts = host.split('.');
      const rootHost =
        parts.length > 2 ? parts.slice(1).join('.') : host;
      window.location.href = `${window.location.protocol}//${value}.${rootHost}/admin`;
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 sm:gap-3',
        className,
      )}
      data-tour-id="dashboard-filters"
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Timeframe</span>
      </div>
      <Select
        value={timeframe}
        onValueChange={(v) => onTimeframeChange(v as TimeframeValue)}
      >
        <SelectTrigger
          size="sm"
          className="h-9 min-w-[140px]"
          data-tour-id="dashboard-filter-timeframe"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMEFRAME_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!siteSelectorLoading && hasMultipleSites ? (
        <>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Site</span>
          </div>
          <Select value={currentSubdomain} onValueChange={handleSiteChange}>
            <SelectTrigger
              size="sm"
              className="h-9 min-w-[160px]"
              data-tour-id="dashboard-filter-site"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {otherSubdomains.map((s) => (
                <SelectItem key={s.id} value={s.subdomain}>
                  {s.subdomain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : null}
    </div>
  );
}
