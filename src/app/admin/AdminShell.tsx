'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { WizardProvider } from '../../contexts/WizardContext';
import { AdminChat } from '../../components/admin-chat';
import { HelpProvider, useHelp } from '../../components/help-system';
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
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { Input } from '../../components/ui/input';
import { Logo } from '../../components/branding/Logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

/**
 * Help mode toggle button
 * Uses the help system context to toggle help mode on/off
 */
function HelpButton() {
  const { helpMode, toggleHelpMode } = useHelp();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleHelpMode}
            className={`p-2 rounded-md transition-colors ${
              helpMode.isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
            title="Toggle help mode (Ctrl+Q)"
          >
            <HelpCircle className={`h-5 w-5 ${
              helpMode.isActive ? '' : 'text-muted-foreground'
            }`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{helpMode.isActive ? 'Exit help mode' : 'Help mode'} (Ctrl+Q)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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

// Routes that should render full-screen without the admin shell (Puck editors)
const FULL_SCREEN_ROUTES = [
  '/design',      // Email designer
  '/puck',        // Page editor with Puck
  '/layout/header',
  '/layout/footer',
  '/layout/announcement',
];

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Main', 'E-Commerce', 'Content']);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if current route should be rendered full-screen (Puck editors)
  const isFullScreenRoute = FULL_SCREEN_ROUTES.some(route => pathname?.includes(route));

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebarCollapsed = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newState));
  };

  const navigationGroups: NavGroup[] = [
    {
      name: 'Main',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, helpKey: 'admin.sidebar.dashboard' },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, helpKey: 'admin.analytics.dashboard' },
      ],
    },
    {
      name: 'E-Commerce',
      items: [
        { name: 'Products', href: '/admin/products', icon: Package, helpKey: 'admin.sidebar.products' },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, helpKey: 'admin.sidebar.orders' },
        { name: 'Order Workflows', href: '/admin/order-workflows', icon: Workflow, helpKey: 'admin.orders.status' },
        { name: 'Shipping', href: '/admin/shipping', icon: Truck, helpKey: 'admin.settings.shipping' },
        { name: 'Customers', href: '/admin/customers', icon: Users, helpKey: 'admin.sidebar.customers' },
      ],
    },
    {
      name: 'Content',
      items: [
        { name: 'Pages', href: '/admin/pages', icon: Layers, helpKey: 'admin.sidebar.pages' },
        { name: 'Blog', href: '/admin/blog', icon: FileText, helpKey: 'admin.sidebar.blog' },
        { name: 'Forms', href: '/admin/forms', icon: ClipboardList, helpKey: 'admin.forms' },
        { name: 'Media', href: '/admin/media', icon: Image, helpKey: 'admin.sidebar.media' },
        { name: 'Email Marketing', href: '/admin/email-marketing', icon: Mail, helpKey: 'admin.settings.email' },
      ],
    },
    {
      name: 'System',
      items: [
        { name: 'Users', href: '/admin/users', icon: Users, helpKey: 'admin.users' },
        { name: 'Roles & Permissions', href: '/admin/roles', icon: Key, helpKey: 'admin.roles' },
        { name: 'Workflows', href: '/admin/workflows', icon: GitBranch, helpKey: 'admin.workflows' },
        { name: 'Settings', href: '/admin/settings', icon: Settings, helpKey: 'admin.sidebar.settings' },
      ],
    },
  ];

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  // Show admin layout for all authenticated users
  // Role-based access control is handled at the page/route level
  if (!user) {
    return <>{children}</>;
  }

  // Render full-screen for Puck editor routes (no sidebar/header)
  if (isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <WizardProvider>
      <HelpProvider>
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
      <div className={`fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-200 ease-in-out ${
        isSidebarCollapsed ? 'w-14' : 'w-56'
      } ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`py-4 border-b border-border ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {isSidebarCollapsed ? (
              <Link href="/admin" className="flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </Link>
            ) : (
              <>
                <Logo href="/admin" size="sm" />
                <p className="text-xs text-muted-foreground mt-1 pl-8">Admin Panel</p>
              </>
            )}
          </div>

          {/* Admin info - hidden when collapsed */}
          {!isSidebarCollapsed && (
            <div className="px-4 py-3 border-b border-border" data-help-key="admin.sidebar.user-info">
              <p className="text-sm font-medium">{user.displayName || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                Super Admin
              </span>
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 py-4 overflow-y-auto ${isSidebarCollapsed ? 'px-1' : 'px-2'}`}>
            <div className="space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.name}>
                  {/* Group header - hidden when collapsed */}
                  {!isSidebarCollapsed && (
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
                  )}
                  {/* Items - always shown when collapsed, follow expand state when expanded */}
                  {(isSidebarCollapsed || expandedGroups.includes(group.name)) && (
                    <ul className={`space-y-0.5 ${!isSidebarCollapsed ? 'mt-1' : ''}`}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveLink(item.href);
                        return (
                          <li key={item.name}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={item.href}
                                    data-help-key={item.helpKey}
                                    className={`flex items-center rounded-lg transition-colors ${
                                      isSidebarCollapsed
                                        ? 'justify-center p-2'
                                        : 'gap-3 px-3 py-2'
                                    } ${
                                      isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                    } ${!isSidebarCollapsed ? 'text-sm font-medium' : ''}`}
                                  >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {!isSidebarCollapsed && item.name}
                                  </Link>
                                </TooltipTrigger>
                                {isSidebarCollapsed && (
                                  <TooltipContent side="right">
                                    <p>{item.name}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
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
          <div className={`border-t border-border ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    data-help-key="admin.sidebar.view-site"
                    className={`flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors mb-2 ${
                      isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-sm font-medium'
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed && 'View Site'}
                  </Link>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                  <TooltipContent side="right">
                    <p>View Site</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut()}
                    data-help-key="admin.sidebar.sign-out"
                    className={`flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors w-full ${
                      isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-sm font-medium'
                    }`}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed && 'Sign Out'}
                  </button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                  <TooltipContent side="right">
                    <p>Sign Out</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Collapse toggle button */}
          <div className={`border-t border-border ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebarCollapsed}
                    data-help-key="admin.sidebar.collapse"
                    className={`flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors w-full ${
                      isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-sm font-medium'
                    }`}
                  >
                    {isSidebarCollapsed ? (
                      <ChevronsRight className="h-4 w-4 shrink-0" />
                    ) : (
                      <>
                        <ChevronsLeft className="h-4 w-4 shrink-0" />
                        Collapse
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'lg:pl-14' : 'lg:pl-56'}`}>
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

            {/* Header Actions - Placeholder for future features */}
            <div className="flex items-center gap-2 ml-4">
              {/* Future: Notifications */}
              <button
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title="Notifications (coming soon)"
                data-help-key="admin.header.notifications"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Help Mode Button */}
              <div data-help-key="admin.header.help">
                <HelpButton />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

          {/* AI Chat Panel - persists across admin routes */}
          <AdminChat />
        </div>
      </HelpProvider>
    </WizardProvider>
  );
}
