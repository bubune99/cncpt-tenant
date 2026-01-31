'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useUser } from "@stackframe/stack";
import { useTheme } from "next-themes";
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
  Image as ImageIcon,
  Key,
  Workflow,
  ClipboardList,
} from 'lucide-react';
import { Input } from '@/components/cms/ui/input';
import { rootDomain, protocol } from '@/lib/cms/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

interface BrandingData {
  siteName: string;
  siteTagline?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  logoAlt?: string;
}

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const subdomain = params.subdomain as string;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Main', 'E-Commerce', 'Content']);
  const [searchQuery, setSearchQuery] = useState('');
  const [branding, setBranding] = useState<BrandingData>({ siteName: subdomain });
  const [mounted, setMounted] = useState(false);

  // Base path for all CMS routes
  const basePath = `/cms/${subdomain}/admin`;

  // Fetch site branding
  useEffect(() => {
    setMounted(true);
    fetchBranding();
  }, [subdomain]);

  const fetchBranding = async () => {
    try {
      // TODO: Fetch from subdomain-specific API
      // For now, use subdomain as site name
      setBranding({ siteName: subdomain });
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  const navigationGroups: NavGroup[] = [
    {
      name: 'Main',
      items: [
        { name: 'Dashboard', href: basePath, icon: LayoutDashboard },
        { name: 'Analytics', href: `${basePath}/analytics`, icon: BarChart3 },
      ],
    },
    {
      name: 'E-Commerce',
      items: [
        { name: 'Products', href: `${basePath}/products`, icon: Package },
        { name: 'Orders', href: `${basePath}/orders`, icon: ShoppingCart },
        { name: 'Order Workflows', href: `${basePath}/order-workflows`, icon: Workflow },
        { name: 'Shipping', href: `${basePath}/shipping`, icon: Truck },
        { name: 'Customers', href: `${basePath}/customers`, icon: Users },
      ],
    },
    {
      name: 'Content',
      items: [
        { name: 'Pages', href: `${basePath}/pages`, icon: Layers },
        { name: 'Blog', href: `${basePath}/blog`, icon: FileText },
        { name: 'Forms', href: `${basePath}/forms`, icon: ClipboardList },
        { name: 'Media', href: `${basePath}/media`, icon: ImageIcon },
        { name: 'Email Marketing', href: `${basePath}/email-marketing`, icon: Mail },
      ],
    },
    {
      name: 'System',
      items: [
        { name: 'Users', href: `${basePath}/users`, icon: Users },
        { name: 'Roles & Permissions', href: `${basePath}/roles`, icon: Key },
        { name: 'Plugins', href: `${basePath}/plugins`, icon: Puzzle },
        { name: 'Workflows', href: `${basePath}/workflows`, icon: GitBranch },
        { name: 'Settings', href: `${basePath}/settings`, icon: Settings },
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
    if (href === basePath) {
      return pathname === basePath;
    }
    return pathname?.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      if (user) {
        await user.signOut();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/handler/sign-out');
    }
  };

  // Site URL for "View Site" link
  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`;

  // Logo URL based on theme
  const logoUrl = mounted && resolvedTheme === "dark" && branding.logoDarkUrl
    ? branding.logoDarkUrl
    : branding.logoUrl;

  if (!user) {
    return <>{children}</>;
  }

  return (
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
          {/* Logo / Site Name */}
          <div className="px-4 py-4 border-b border-border">
            <Link href={basePath} className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={branding.logoAlt || branding.siteName}
                    width={24}
                    height={24}
                    className="h-6 w-auto object-contain"
                    priority
                  />
                ) : (
                  <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {branding.siteName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-lg">
                  {branding.siteName}
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground mt-1 pl-8">Admin Panel</p>
          </div>

          {/* Admin info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">{user.displayName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
            <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              Site Admin
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
              href={siteUrl}
              target="_blank"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              View Site
            </Link>
            <button
              onClick={handleSignOut}
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

            {/* Header Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title="Notifications (coming soon)"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
              </button>
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
    </div>
  );
}
