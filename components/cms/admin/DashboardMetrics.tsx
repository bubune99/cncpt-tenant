'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  Package,
  ShoppingCart,
  Zap
} from 'lucide-react';

interface Metrics {
  totalUsers: number;
  activeSubscriptions: number;
  trialsActive: number;
  totalCustomers: number;
  monthlyRevenue: number;
  totalProducts: number;
  totalOrders: number;
  apiCallsToday: number;
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      description: 'Registered user accounts',
      color: 'text-blue-600'
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      icon: TrendingUp,
      description: 'Paying customers',
      color: 'text-green-600'
    },
    {
      title: 'Active Trials',
      value: metrics.trialsActive,
      icon: Activity,
      description: 'Trial accounts',
      color: 'text-yellow-600'
    },
    {
      title: 'Total Customers',
      value: metrics.totalCustomers,
      icon: Users,
      description: 'End users across all businesses',
      color: 'text-purple-600'
    },
    {
      title: 'Monthly Revenue',
      value: `$${metrics.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Recurring revenue',
      color: 'text-green-600'
    },
    {
      title: 'Total Products',
      value: metrics.totalProducts,
      icon: Package,
      description: 'Products across all stores',
      color: 'text-orange-600'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      description: 'Orders this month',
      color: 'text-indigo-600'
    },
    {
      title: 'API Calls Today',
      value: metrics.apiCallsToday.toLocaleString(),
      icon: Zap,
      description: 'Platform API usage',
      color: 'text-pink-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}