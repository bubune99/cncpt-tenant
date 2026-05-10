'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubdomainAccess } from '@/hooks/use-subdomain-access';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import { Button } from '@/components/cms/ui/button';
import QuickActions from '@/components/cms/admin/QuickActions';
import { MetricsKpiStrip } from '@/components/cms/admin/metrics-kpi-strip';
import { CompositionCardsRow } from '@/components/cms/admin/composition-cards-row';
import { RevenueTrendCard } from '@/components/cms/admin/revenue-trend-card';
import {
  DashboardFilters,
  TIMEFRAME_OPTIONS,
  type TimeframeValue,
} from '@/components/cms/admin/dashboard-filters';
import {
  ArrowRight,
  Loader2,
  Shield,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { isDemoSubdomain, DEMO_USER } from '@/lib/demo';
import { useCMSConfig } from '@/contexts/CMSConfigContext';

const VALID_TIMEFRAMES = TIMEFRAME_OPTIONS.map((o) => o.value) as readonly string[];

function parseTimeframeParam(raw: string | null): TimeframeValue {
  if (raw && VALID_TIMEFRAMES.includes(raw)) {
    return raw as TimeframeValue;
  }
  return 'month';
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = params?.subdomain as string;
  const { buildPath } = useCMSConfig();

  const isDemo = isDemoSubdomain(subdomain);

  const {
    hasAccess,
    accessType,
    isLoading: accessLoading,
    error: accessError,
    isDemo: isDemoAccess,
  } = useSubdomainAccess('admin');

  // Timeframe is sourced from the URL so refresh + share-link preserves it.
  const timeframe = useMemo(
    () => parseTimeframeParam(searchParams?.get('timeframe') ?? null),
    [searchParams],
  );

  const handleTimeframeChange = useCallback(
    (next: TimeframeValue) => {
      if (!pathname) return;
      const sp = new URLSearchParams(searchParams?.toString() || '');
      if (next === 'month') {
        sp.delete('timeframe');
      } else {
        sp.set('timeframe', next);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, searchParams, router],
  );

  const isLoading = isDemo ? accessLoading : authLoading || accessLoading;

  useEffect(() => {
    if (!isLoading) {
      if (isDemo || isDemoAccess) return;

      if (!user) {
        router.push(`/handler/sign-in?redirect=/admin`);
      } else if (accessError === 'Not authenticated') {
        router.push(`/handler/sign-in?redirect=/admin`);
      } else if (!hasAccess) {
        router.push('/');
      }
    }
  }, [user, isLoading, hasAccess, accessError, router, isDemo, isDemoAccess]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const showDashboard = isDemo || isDemoAccess || (user && hasAccess);

  if (!showDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground mb-4">
            You need to be the owner of this subdomain or a team admin to
            access this area.
          </p>
          <Button onClick={() => router.push('/')} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const displayName = isDemo ? DEMO_USER.displayName : user?.displayName || 'Admin';

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-tour-id="admin-dashboard-page">
      {(isDemo || isDemoAccess) && (
        <div
          className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3"
          data-tour-id="admin-demo-banner"
        >
          <Eye className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-orange-700 dark:text-orange-400">
              Demo Mode
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400/80">
              You&apos;re viewing a read-only demo of the CNCPT CMS. Explore
              all features freely!
            </p>
          </div>
        </div>
      )}

      {/* Page header with timeframe + site filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold"
            data-tour-id="admin-dashboard-heading"
          >
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {displayName}
            {accessType && !isDemo && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {accessType === 'owner' ? 'Owner' : 'Team Admin'}
              </span>
            )}
            {(isDemo || isDemoAccess) && (
              <span className="ml-2 text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded">
                Demo Viewer
              </span>
            )}
          </p>
        </div>
        <DashboardFilters
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
        />
      </div>

      {/* 6-tile KPI strip */}
      <div className="mb-6" data-help-key="admin.dashboard.kpis">
        <MetricsKpiStrip timeframe={timeframe} />
      </div>

      {/* Revenue trend + composition cards */}
      <div className="mb-6 grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendCard range="30d" />
        </div>
        <div>
          <Card
            className="h-full"
            data-help-key="admin.dashboard.snapshot"
            data-tour-id="dashboard-snapshot"
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                What needs your attention
              </CardTitle>
              <CardDescription className="text-xs">
                Quick jumps to the spots where work piles up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={buildPath('/admin/orders?status=PENDING')}>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm"
                >
                  Pending orders
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={buildPath('/admin/products?status=DRAFT')}>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm"
                >
                  Draft products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={buildPath('/admin/customers')}>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm"
                >
                  Recent customers
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={buildPath('/admin/reviews')}>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm"
                >
                  Review queue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Composition cards */}
      <div className="mb-6">
        <CompositionCardsRow />
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-6" data-help-key="admin.dashboard.quick-actions">
        <QuickActions />
      </div>
    </div>
  );
}
