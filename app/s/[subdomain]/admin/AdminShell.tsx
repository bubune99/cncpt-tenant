'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { WizardProvider } from '@/contexts/WizardContext';
import { CMSConfigProvider, type CMSConfig, type ModuleNavGroupData } from '@/contexts/CMSConfigContext';
import { HelpProvider, useHelpOptional } from '@/components/cms/help-system';
import { ModeToggle } from '@/components/cms/mode-toggle';
import { AdminChat } from '@/components/cms/admin-chat';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Mail,
  BarChart3,
  Puzzle,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  Layers,
  GitBranch,
  Image,
  Key,
  Workflow,
  ClipboardList,
  CalendarDays,
  Store,
  ToggleLeft,
} from 'lucide-react';
import { Input } from '@/components/cms/ui/input';
import { TenantAdminLogo } from '@/components/cms/branding/TenantAdminLogo';

// Icon name -> Lucide component map for module-driven nav
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Mail,
  BarChart3,
  Puzzle,
  Settings,
  Layers,
  GitBranch,
  Image,
  Key,
  Workflow,
  ClipboardList,
  CalendarDays,
  Store,
  ToggleLeft,
  Search,
  Bell,
  HelpCircle,
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  helpKey?: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

// Re-export CMSConfig as AdminShellConfig for backwards compatibility
export type AdminShellConfig = CMSConfig;

// Header actions component that can access help context
function HeaderActions() {
  const help = useHelpOptional();

  const handleHelpClick = () => {
    if (help) {
      help.toggleHelpMode();
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4" data-help-key="admin.header.actions">
      {/* Theme Toggle */}
      <div data-help-key="admin.header.theme">
        <ModeToggle />
      </div>

      {/* Notifications */}
      <button
        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-md hover:bg-accent transition-colors"
        title="Notifications (coming soon)"
        data-help-key="admin.header.notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Help Mode Toggle */}
      <button
        className={`flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors ${
          help?.helpMode?.isActive
            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
            : 'hover:bg-accent'
        }`}
        title={help?.helpMode?.isActive ? 'Exit Help Mode (Ctrl+Q)' : 'Enter Help Mode (Ctrl+Q)'}
        onClick={handleHelpClick}
        data-help-key="admin.header.help"
      >
        <HelpCircle className={`h-5 w-5 ${help?.helpMode?.isActive ? '' : 'text-muted-foreground'}`} />
      </button>
    </div>
  );
}

export function AdminShell({
  children,
  config = {},
}: {
  children: React.ReactNode;
  config?: CMSConfig;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Main', 'E-Commerce', 'Content']);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract config options with defaults
  const {
    basePath = '',
    hiddenGroups = [],
    hiddenItems = [],
    siteUrl = '/',
    siteName,
    userRole = 'Super Admin',
    showChat = true,
    isDemo = false,
  } = config;

  // Normalize pathname by stripping the /s/[subdomain] prefix that middleware adds internally.
  // usePathname() returns the internal rewritten path (e.g. /s/test/admin/products),
  // but links should use plain paths (e.g. /admin/products) since middleware handles rewriting.
  const normalizePath = (p: string | null): string => {
    if (!p) return '';
    if (basePath && p.startsWith(basePath)) {
      return p.slice(basePath.length) || '/';
    }
    return p;
  };

  // Build navigation: use module-driven groups if provided, else fallback to hardcoded
  const { moduleNavGroups } = config;

  const allNavigationGroups: NavGroup[] = moduleNavGroups
    ? moduleNavGroups.map(group => ({
        name: group.name,
        items: group.items.map(item => ({
          name: item.name,
          href: item.href,
          icon: ICON_MAP[item.icon] || Layers,
          helpKey: item.helpKey,
        })),
      }))
    : [
        {
          name: 'Main',
          items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, helpKey: 'admin.sidebar.dashboard' },
            { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, helpKey: 'admin.sidebar.analytics' },
          ],
        },
        {
          name: 'E-Commerce',
          items: [
            { name: 'Products', href: '/admin/products', icon: Package, helpKey: 'admin.sidebar.products' },
            { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, helpKey: 'admin.sidebar.orders' },
            { name: 'Order Workflows', href: '/admin/order-workflows', icon: Workflow, helpKey: 'admin.sidebar.order-workflows' },
            { name: 'Shipping', href: '/admin/shipping', icon: Truck, helpKey: 'admin.sidebar.shipping' },
            { name: 'Customers', href: '/admin/customers', icon: Users, helpKey: 'admin.sidebar.customers' },
          ],
        },
        {
          name: 'Content',
          items: [
            { name: 'Pages', href: '/admin/pages', icon: Layers, helpKey: 'admin.sidebar.pages' },
            { name: 'Blog', href: '/admin/blog', icon: FileText, helpKey: 'admin.sidebar.blog' },
            { name: 'Forms', href: '/admin/forms', icon: ClipboardList, helpKey: 'admin.sidebar.forms' },
            { name: 'Media', href: '/admin/media', icon: Image, helpKey: 'admin.sidebar.media' },
            { name: 'Marketplace', href: '/admin/marketplace', icon: Store, helpKey: 'admin.sidebar.marketplace' },
            { name: 'Email Marketing', href: '/admin/email-marketing', icon: Mail, helpKey: 'admin.sidebar.email-marketing' },
          ],
        },
        {
          name: 'System',
          items: [
            { name: 'Users', href: '/admin/users', icon: Users, helpKey: 'admin.sidebar.users' },
            { name: 'Roles & Permissions', href: '/admin/roles', icon: Key, helpKey: 'admin.sidebar.roles' },
            { name: 'Modules', href: '/admin/modules', icon: Puzzle, helpKey: 'admin.sidebar.modules' },
            { name: 'Settings', href: '/admin/settings', icon: Settings, helpKey: 'admin.sidebar.settings' },
          ],
        },
      ];

  // Filter navigation based on config
  const navigationGroups = allNavigationGroups
    .filter(group => !hiddenGroups.includes(group.name))
    .map(group => ({
      ...group,
      items: group.items.filter(item => !hiddenItems.includes(item.name)),
    }))
    .filter(group => group.items.length > 0);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const normalizedPathname = normalizePath(pathname);

  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return normalizedPathname === '/admin';
    }
    return normalizedPathname.startsWith(href);
  };

  // Show admin layout for authenticated users OR demo mode
  // Role-based access control is handled at the page/route level
  if (!user && !isDemo) {
    return <>{children}</>;
  }

  // Create a display user for demo mode
  const displayUser = isDemo && !user
    ? { displayName: 'Demo User', primaryEmail: 'demo@cncptweb.com' }
    : user;

  return (
    <CMSConfigProvider config={config}>
      <HelpProvider>
        <WizardProvider>
          <div className="min-h-screen bg-background">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-3 left-3 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center h-11 w-11 rounded-md bg-card border border-border shadow-sm"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile backdrop overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 lg:w-56 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo — shows tenant logo if configured, falls back to global Logo */}
            <div className="px-4 py-4 border-b border-border">
              <TenantAdminLogo fallbackSiteName={siteName} />
            </div>

            {/* Admin info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">{displayUser?.displayName || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{displayUser?.primaryEmail}</p>
              <span className={`inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full ${
                isDemo
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'bg-primary/10 text-primary'
              }`}>
                {isDemo ? 'Demo Viewer' : userRole}
              </span>
            </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <div className="space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.name}>
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors min-h-[44px] lg:min-h-0 lg:py-1.5"
                  >
                    {group.name}
                    {expandedGroups.includes(group.name) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {expandedGroups.includes(group.name) && (
                    <ul className="mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveLink(item.href);
                        return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                data-help-key={item.helpKey}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {item.name}
                              </Link>
                            </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border" data-help-key="admin.sidebar.footer">
              <Link
                href={siteUrl}
                onClick={() => setIsSidebarOpen(false)}
                data-help-key="admin.sidebar.view-site"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-2 min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4" />
                View Site
              </Link>
              {isDemo ? (
                <Link
                  href="/pricing"
                  onClick={() => setIsSidebarOpen(false)}
                  data-help-key="admin.sidebar.start-trial"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors w-full min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Start Free Trial
                </Link>
              ) : (
                <button
                  onClick={() => { setIsSidebarOpen(false); signOut(); }}
                  data-help-key="admin.sidebar.sign-out"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Content Header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-14 lg:h-16 pl-16 pr-3 sm:pr-4 lg:pl-6 lg:pr-8">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl" data-help-key="admin.header.search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products, orders, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Header Actions */}
            <HeaderActions />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

          {/* AI Chat Panel - persists across admin routes */}
          {showChat && <AdminChat />}
        </div>
        </WizardProvider>
      </HelpProvider>
    </CMSConfigProvider>
  );
}
