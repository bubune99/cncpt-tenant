'use client';

import WidgetShell from '../WidgetShell';
import { Button } from '../../../ui/button';
import {
  Plus,
  Download,
  Mail,
  Settings,
  FileText,
  TrendingUp,
  ArrowRight,
  Package as PackageIcon,
  ShoppingCart,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuickActionsWidget({ editing }: { editing?: boolean }) {
  const router = useRouter();

  const actions = [
    { label: 'Add Product', icon: Plus, href: '/admin/products/new', helpKey: 'admin.dashboard.action.add-product' },
    { label: 'Analytics', icon: TrendingUp, href: '/admin/analytics', helpKey: 'admin.dashboard.action.analytics' },
    { label: 'New Blog Post', icon: FileText, href: '/admin/blog/new', helpKey: 'admin.dashboard.action.new-blog' },
    { label: 'Email Marketing', icon: Mail, href: '/admin/email-marketing', helpKey: 'admin.dashboard.action.email' },
    { label: 'Settings', icon: Settings, href: '/admin/settings', helpKey: 'admin.dashboard.action.settings' },
    { label: 'Products', icon: PackageIcon, href: '/admin/products', helpKey: 'admin.dashboard.action.products' },
    { label: 'Orders', icon: ShoppingCart, href: '/admin/orders', helpKey: 'admin.dashboard.action.orders' },
    { label: 'Customers', icon: Users, href: '/admin/customers', helpKey: 'admin.dashboard.action.customers' },
    { label: 'Pages', icon: FileText, href: '/admin/pages', helpKey: 'admin.dashboard.action.pages' },
    { label: 'Blog', icon: FileText, href: '/admin/blog', helpKey: 'admin.dashboard.action.blog' },
    { label: 'Media', icon: ImageIcon, href: '/admin/media', helpKey: 'admin.dashboard.action.media' },
  ];

  return (
    <WidgetShell title="Quick Actions" editing={editing}>
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href} data-help-key={a.helpKey}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8"
              >
                <Icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <span className="truncate">{a.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </WidgetShell>
  );
}
