'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubdomainAccess } from '@/hooks/use-subdomain-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cms/ui/card';
import { Button } from '@/components/cms/ui/button';
import DashboardMetrics from '@/components/cms/admin/DashboardMetrics';
import QuickActions from '@/components/cms/admin/QuickActions';
import {
  Users,
  Package,
  FileText,
  ShoppingCart,
  ArrowRight,
  Loader2,
  Shield,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { isDemoSubdomain, DEMO_USER } from '@/lib/demo';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalBlogPosts: number;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subdomain = params?.subdomain as string;

  // Check if this is the demo subdomain
  const isDemo = isDemoSubdomain(subdomain);

  // Use subdomain-based access control - check for admin level access
  const { hasAccess, accessType, isLoading: accessLoading, error: accessError, isDemo: isDemoAccess } = useSubdomainAccess('admin');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // For demo mode, skip auth loading check
  const isLoading = isDemo ? accessLoading : (authLoading || accessLoading);

  useEffect(() => {
    if (!isLoading) {
      // Demo mode: allow access without authentication
      if (isDemo || isDemoAccess) {
        fetchDashboardStats();
        return;
      }

      if (!user) {
        router.push(`/handler/sign-in?redirect=/admin`);
      } else if (accessError === 'Not authenticated') {
        router.push(`/handler/sign-in?redirect=/admin`);
      } else if (!hasAccess) {
        // No admin access to this subdomain, redirect to subdomain home
        router.push('/');
      } else {
        // Has admin access, load stats
        fetchDashboardStats();
      }
    }
  }, [user, isLoading, hasAccess, accessError, router, isDemo, isDemoAccess]);

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

  // Allow demo mode even without user
  const showDashboard = (isDemo || isDemoAccess) || (user && hasAccess);

  if (!showDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-4">
            You need to be the owner of this subdomain or a team admin to access this area.
          </p>
          <Button onClick={() => router.push('/')} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Get display name for welcome message
  const displayName = isDemo ? DEMO_USER.displayName : (user?.displayName || 'Admin');

  return (
    <div className="p-6 lg:p-8">
      {/* Demo Mode Banner */}
      {(isDemo || isDemoAccess) && (
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
          <Eye className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-orange-700 dark:text-orange-400">Demo Mode</p>
            <p className="text-sm text-orange-600 dark:text-orange-400/80">
              You&apos;re viewing a read-only demo of the CNCPT CMS. Explore all features freely!
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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

      {/* Enhanced Metrics Dashboard */}
      <div className="mb-6" data-help-key="admin.dashboard.metrics">
        <DashboardMetrics />
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-6" data-help-key="admin.dashboard.quick-actions">
        <QuickActions />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6" data-help-key="admin.dashboard.stats">
        <Card data-help-key="admin.dashboard.stat.users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card data-help-key="admin.dashboard.stat.products">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card data-help-key="admin.dashboard.stat.orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card data-help-key="admin.dashboard.stat.blog">
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
        <Card data-help-key="admin.dashboard.quick-links">
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

        <Card data-help-key="admin.dashboard.content-management">
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