'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
}

interface Anomaly extends DataPoint {
  zScore: number;
  /** "+" means spike, "-" means dip */
  direction: 'spike' | 'dip';
}

export interface RevenueTrendCardProps {
  /** Range tag passed to /api/cms/admin/dashboard/time-series (7d|30d|90d). */
  range?: '7d' | '30d' | '90d';
  className?: string;
}

/**
 * Pure: detect points more than `threshold` standard deviations away from
 * the rolling 4-week (or full-series, if shorter) mean. Returns an empty
 * list when the series is too small (< 7 points) to support meaningful
 * Z-scoring.
 */
function detectAnomalies(data: DataPoint[], threshold = 2): Anomaly[] {
  if (data.length < 7) return [];
  const values = data.map((d) => d.value);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return [];

  const anomalies: Anomaly[] = [];
  data.forEach((d) => {
    const z = (d.value - mean) / std;
    if (Math.abs(z) >= threshold) {
      anomalies.push({
        ...d,
        zScore: Math.round(z * 100) / 100,
        direction: z > 0 ? 'spike' : 'dip',
      });
    }
  });
  return anomalies;
}

/**
 * Revenue line chart with anomaly markers. Pulls daily revenue from the
 * existing time-series API and overlays "!" pins on points >= 2σ from the
 * series mean. Renders a graceful empty state when there's no data yet so
 * brand-new tenants don't see a broken chart.
 */
export function RevenueTrendCard({
  range = '30d',
  className,
}: RevenueTrendCardProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/cms/admin/dashboard/time-series?metric=revenue&range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: { data: DataPoint[] }) => {
        if (cancelled) return;
        setData(json.data || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load revenue data');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const anomalies = useMemo(() => detectAnomalies(data), [data]);
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card
      className={className}
      data-tour-id="dashboard-revenue-chart"
      data-help-key="admin.dashboard.revenue-chart"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            Revenue Trend
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Daily revenue over the last {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            {anomalies.length > 0
              ? ` · ${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} detected`
              : ''}
          </p>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="h-[220px]">
          {loading ? (
            <div className="h-full w-full bg-muted rounded animate-pulse" />
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              {error}
            </div>
          ) : !hasData ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center gap-1">
              <p className="text-sm text-muted-foreground">No revenue yet</p>
              <p className="text-xs text-muted-foreground/70">
                Orders will appear here once you start receiving them.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  formatter={
                    ((value: number) => [
                      `$${value.toFixed(2)}`,
                      'Revenue',
                    ]) as never
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                {anomalies.map((a) => (
                  <ReferenceDot
                    key={`anomaly-${a.date}`}
                    x={a.date}
                    y={a.value}
                    r={5}
                    fill={a.direction === 'spike' ? '#16a34a' : '#dc2626'}
                    stroke="white"
                    strokeWidth={2}
                    isFront
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {anomalies.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {anomalies.slice(0, 3).map((a) => (
              <li
                key={`legend-${a.date}`}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      a.direction === 'spike' ? '#16a34a' : '#dc2626',
                  }}
                />
                <span>
                  {a.date} — {a.direction === 'spike' ? 'Spike' : 'Dip'} (
                  {a.zScore > 0 ? '+' : ''}
                  {a.zScore.toFixed(1)}σ)
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
