'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { WizardProvider } from '@/contexts/WizardContext';
import { AdminChat } from '@/components/admin-chat';
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
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/branding/Logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Main', 'E-Commerce', 'Content']);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationGroups: NavGroup[] = [
    {
      name: 'Main',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ],
    },
    {
      name: 'E-Commerce',
      items: [
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Order Workflows', href: '/admin/order-workflows', icon: Workflow },
        { name: 'Shipping', href: '/admin/shipping', icon: Truck },
        { name: 'Customers', href: '/admin/customers', icon: Users },
      ],
    },
    {
      name: 'Content',
      items: [
        { name: 'Pages', href: '/admin/pages', icon: Layers },
        { name: 'Blog', href: '/admin/blog', icon: FileText },
        { name: 'Forms', href: '/admin/forms', icon: ClipboardList },
        { name: 'Media', href: '/admin/media', icon: Image },
        { name: 'Email Marketing', href: '/admin/email-marketing', icon: Mail },
      ],
    },
    {
      name: 'System',
      items: [
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Roles & Permissions', href: '/admin/roles', icon: Key },
        { name: 'Plugins', href: '/admin/plugins', icon: Puzzle },
        { name: 'Workflows', href: '/admin/workflows', icon: GitBranch },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
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

  return (
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
            <Logo href="/admin" size="sm" />
            <p className="text-xs text-muted-foreground mt-1 pl-8">Admin Panel</p>
          </div>

          {/* Admin info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">{user.displayName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
            <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              Super Admin
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
                              href={item.href}
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
          <div className="p-4 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              View Site
            </Link>
            <button
              onClick={() => signOut()}
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
            <div className="flex-1 max-w-xl">
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
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Future: Help */}
              <button
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title="Help (coming soon)"
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </button>
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
    </WizardProvider>
  );
}
