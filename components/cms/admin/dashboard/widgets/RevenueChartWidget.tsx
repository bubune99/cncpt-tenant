'use client';

import { useEffect, useState, useCallback } from 'react';
import WidgetShell from '../WidgetShell';
import {
  LineChart,
  Line,
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

export default function RevenueChartWidget({ editing }: { editing?: boolean }) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/admin/dashboard/time-series?metric=revenue&range=30d');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setError('Could not load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <WidgetShell
      title="Revenue"
      editing={editing}
      loading={loading}
      error={error}
      onRefresh={fetchData}
      noPadding
    >
      <div className="h-full min-h-[200px] px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <LineChart data={data}>
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
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              formatter={((value: number) => [`$${value.toFixed(2)}`, 'Revenue']) as never}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
}
