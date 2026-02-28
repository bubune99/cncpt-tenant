'use client';

import { useEffect, useState, useCallback } from 'react';
import WidgetShell from '../WidgetShell';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

export default function TrafficChartWidget({ editing }: { editing?: boolean }) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/admin/dashboard/time-series?metric=traffic&range=30d');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setError('Could not load traffic data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <WidgetShell
      title="Traffic"
      editing={editing}
      loading={loading}
      error={error}
      onRefresh={fetchData}
      noPadding
    >
      <div className="h-full min-h-[200px] px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <defs>
              <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="url(#traffic-fill)"
              strokeWidth={2}
              name="Page Views"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
}
