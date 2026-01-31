'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { WizardProvider } from '@/contexts/WizardContext';
import { CMSConfigProvider, type CMSConfig } from '@/contexts/CMSConfigContext';
import { HelpProvider, useHelpOptional } from '@/components/cms/help-system';
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
} from 'lucide-react';
import { Input } from '@/components/cms/ui/input';
import { Logo } from '@/components/cms/branding/Logo';

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
    <div className="flex items-center gap-2 ml-4" data-help-key="admin.header.actions">
      {/* Notifications */}
      <button
        className="p-2 rounded-md hover:bg-accent transition-colors"
        title="Notifications (coming soon)"
        data-help-key="admin.header.notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Help Mode Toggle */}
      <button
        className={`p-2 rounded-md transition-colors ${
          help?.helpMode?.isActive
            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  } = config;

  // Helper to build paths with basePath prefix
  const buildPath = (path: string): string => {
    if (!basePath) return path;
    // Replace /admin with basePath/admin
    return path.replace('/admin', `${basePath}/admin`);
  };

  const allNavigationGroups: NavGroup[] = [
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
        { name: 'Email Marketing', href: '/admin/email-marketing', icon: Mail, helpKey: 'admin.sidebar.email-marketing' },
      ],
    },
    {
      name: 'System',
      items: [
        { name: 'Users', href: '/admin/users', icon: Users, helpKey: 'admin.sidebar.users' },
        { name: 'Roles & Permissions', href: '/admin/roles', icon: Key, helpKey: 'admin.sidebar.roles' },
        { name: 'Plugins', href: '/admin/plugins', icon: Puzzle, helpKey: 'admin.sidebar.plugins' },
        { name: 'Workflows', href: '/admin/workflows', icon: GitBranch, helpKey: 'admin.sidebar.workflows' },
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

  const isActiveLink = (href: string) => {
    const fullHref = buildPath(href);
    if (href === '/admin') {
      return pathname === fullHref;
    }
    return pathname?.startsWith(fullHref);
  };

  // Show admin layout for all authenticated users
  // Role-based access control is handled at the page/route level
  if (!user) {
    return <>{children}</>;
  }

  return (
    <CMSConfigProvider config={config}>
      <HelpProvider>
        <WizardProvider>
          <div className="min-h-screen bg-background">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md bg-card border border-border"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-56 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-border">
              <Logo href={buildPath('/admin')} size="sm" />
              <p className="text-xs text-muted-foreground mt-1 pl-8">
                {siteName ? `${siteName} Admin` : 'Admin Panel'}
              </p>
            </div>

            {/* Admin info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">{user.displayName || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {userRole}
              </span>
            </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <div className="space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.name}>
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
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
                                href={buildPath(item.href)}
                                data-help-key={item.helpKey}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                data-help-key="admin.sidebar.view-site"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                View Site
              </Link>
              <button
                onClick={() => signOut()}
                data-help-key="admin.sidebar.sign-out"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Content Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
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
