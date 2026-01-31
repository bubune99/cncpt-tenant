'use client';

/**
 * Authenticated Area Shell
 *
 * Main layout component for authenticated areas.
 * Includes sidebar, header, breadcrumbs, and content area.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronRight, Home, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AuthenticatedAreaSidebar } from './Sidebar';
import type { NavGroup, AuthenticatedAreaConfig } from '@/lib/authenticated-routes/types';
import { cn } from '@/lib/utils';

interface ShellProps {
  areaId: string;
  children: React.ReactNode;
  className?: string;
}

interface NavigationData {
  areaId: string;
  areaName: string;
  basePath: string;
  groups: NavGroup[];
  layout?: AuthenticatedAreaConfig['layout'];
}

export function AuthenticatedAreaShell({ areaId, children, className }: ShellProps) {
  const { user, signOut, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; href: string }>>([]);
  const [navError, setNavError] = useState<string | null>(null);

  // Fetch navigation data
  const fetchNavigation = useCallback(async () => {
    try {
      const response = await fetch(`/api/navigation/${areaId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch navigation');
      }
      const data = await response.json();
      setNavData(data);
      setNavError(null);
    } catch (error) {
      console.error('Navigation fetch error:', error);
      setNavError('Failed to load navigation');
    }
  }, [areaId]);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  // Build breadcrumbs from current path
  useEffect(() => {
    if (!navData) return;

    const buildBreadcrumbs = () => {
      const crumbs: Array<{ label: string; href: string }> = [
        { label: navData.areaName, href: navData.basePath },
      ];

      const relativePath = pathname?.replace(navData.basePath, '') || '';
      const segments = relativePath.split('/').filter(Boolean);

      let currentPath = navData.basePath;
      for (const segment of segments) {
        currentPath += `/${segment}`;

        // Try to find label from nav
        let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        for (const group of navData.groups) {
          const item = group.items.find(i => i.href === currentPath);
          if (item) {
            label = item.label;
            break;
          }
        }

        crumbs.push({ label, href: currentPath });
      }

      setBreadcrumbs(crumbs);
    };

    buildBreadcrumbs();
  }, [pathname, navData]);

  // Handle create page
  const handleCreatePage = () => {
    if (navData) {
      // Navigate to editor with the area's puck pages path
      const puckPath = navData.basePath.replace(/^\//, '') + '/pages/new';
      router.push(`/editor?path=${encodeURIComponent(puckPath)}&area=${areaId}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access this area.</p>
          <Link
            href="/handler/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const showSidebar = navData?.layout?.showSidebar !== false;
  const sidebarWidth = navData?.layout?.sidebarWidth || 240;
  const showHeader = navData?.layout?.showHeader !== false;
  const showBreadcrumbs = navData?.layout?.showBreadcrumbs !== false;

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile sidebar toggle */}
      {showSidebar && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-md bg-card border border-border shadow-sm"
          >
            {isMobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile sidebar backdrop */}
          {isMobileSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar content */}
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-transform duration-200 ease-in-out',
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
              'lg:translate-x-0'
            )}
            style={{ width: sidebarWidth }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar header */}
              <div className="px-4 py-4 border-b border-border">
                <Link href={navData?.basePath || '/'} className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{navData?.areaName || 'Loading...'}</span>
                </Link>
              </div>

              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.primaryEmail}</p>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-2 py-4">
                {navError ? (
                  <div className="px-3 py-2 text-sm text-destructive">{navError}</div>
                ) : navData ? (
                  <AuthenticatedAreaSidebar
                    areaId={navData.areaId}
                    areaName={navData.areaName}
                    basePath={navData.basePath}
                    groups={navData.groups}
                    onCreatePage={handleCreatePage}
                    canCreatePages={true}
                  />
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading navigation...</div>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="p-4 border-t border-border space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Site
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div
        className="transition-all duration-200"
        style={{ marginLeft: showSidebar ? sidebarWidth : 0 }}
      >
        {/* Header with breadcrumbs */}
        {showHeader && (
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center h-14 px-6">
              {showBreadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                      )}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium">{crumb.label}</span>
                      ) : (
                        <Link
                          href={crumb.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              )}
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}
