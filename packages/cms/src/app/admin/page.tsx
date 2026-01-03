'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { isAdminUser } from '@/lib/admin-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardMetrics from '@/components/admin/DashboardMetrics';
import QuickActions from '@/components/admin/QuickActions';
import {
  Users,
  Package,
  FileText,
  ShoppingCart,
  ArrowRight,
  Loader2,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalBlogPosts: number;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/handler/sign-in?redirect=/admin');
      } else if (!isAdminUser(user.primaryEmail)) {
        // Not admin, redirect to home
        router.push('/');
      } else {
        // Is admin, load stats
        fetchDashboardStats();
      }
    }
  }, [user, isLoading, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/stats-simple');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Set empty stats on error
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalBlogPosts: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminUser(user.primaryEmail)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Only</h2>
          <p className="text-muted-foreground mb-4">This area is restricted to administrators.</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user.displayName || 'Admin'}</p>
      </div>

      {/* Enhanced Metrics Dashboard */}
      <div className="mb-6">
        <DashboardMetrics />
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBlogPosts || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Navigate to common sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/products">
              <Button variant="outline" className="w-full justify-between text-sm">
                Manage Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-between text-sm">
                View Orders
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/customers">
              <Button variant="outline" className="w-full justify-between text-sm">
                Customer List
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Manage your site content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/pages">
              <Button variant="outline" className="w-full justify-between text-sm">
                Edit Pages
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/blog">
              <Button variant="outline" className="w-full justify-between text-sm">
                Blog Posts
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/media">
              <Button variant="outline" className="w-full justify-between text-sm">
                Media Library
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}