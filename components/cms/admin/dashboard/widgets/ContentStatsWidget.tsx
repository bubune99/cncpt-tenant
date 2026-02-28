'use client';

import { useEffect, useState, useCallback } from 'react';
import WidgetShell from '../WidgetShell';
import { FileText, Layout, Image as ImageIcon, Tag } from 'lucide-react';

interface Stats {
  totalBlogPosts: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
}

export default function ContentStatsWidget({ editing }: { editing?: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats-simple');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setStats(json.stats);
    } catch {
      setError('Could not load content stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const items = stats
    ? [
        { label: 'Blog Posts', value: stats.totalBlogPosts, icon: FileText, color: 'text-blue-600' },
        { label: 'Products', value: stats.totalProducts, icon: Tag, color: 'text-green-600' },
        { label: 'Orders', value: stats.totalOrders, icon: Layout, color: 'text-purple-600' },
        { label: 'Users', value: stats.totalUsers, icon: ImageIcon, color: 'text-orange-600' },
      ]
    : [];

  return (
    <WidgetShell
      title="Content Stats"
      editing={editing}
      loading={loading}
      error={error}
      onRefresh={fetchData}
    >
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="text-lg font-bold">{item.value}</span>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}
