'use client';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Plus,
  Download,
  Mail,
  Settings,
  FileText,
  Package,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: 'Add Product',
      description: 'Create a new product',
      icon: Plus,
      action: () => router.push('/admin/products/new'),
      variant: 'default' as const
    },
    {
      title: 'View Analytics',
      description: 'Performance metrics',
      icon: TrendingUp,
      action: () => router.push('/admin/analytics'),
      variant: 'outline' as const
    },
    {
      title: 'New Blog Post',
      description: 'Write a new article',
      icon: FileText,
      action: () => router.push('/admin/blog/new'),
      variant: 'outline' as const
    },
    {
      title: 'Export Data',
      description: 'Download reports',
      icon: Download,
      action: () => handleExport(),
      variant: 'outline' as const
    },
    {
      title: 'Email Marketing',
      description: 'Send email campaigns',
      icon: Mail,
      action: () => router.push('/admin/email-marketing'),
      variant: 'outline' as const
    },
    {
      title: 'System Settings',
      description: 'Configure settings',
      icon: Settings,
      action: () => router.push('/admin/settings'),
      variant: 'outline' as const
    }
  ];

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                className="justify-start"
                onClick={action.action}
              >
                <Icon className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}