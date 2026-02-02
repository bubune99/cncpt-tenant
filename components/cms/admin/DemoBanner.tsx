'use client';

import { Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/cms/ui/button';

interface DemoBannerProps {
  compact?: boolean;
}

export function DemoBanner({ compact = false }: DemoBannerProps) {
  if (compact) {
    return (
      <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2">
        <Eye className="h-4 w-4 text-orange-500 flex-shrink-0" />
        <span className="text-sm text-orange-600 dark:text-orange-400">
          Demo Mode - Read Only
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Eye className="h-5 w-5 text-orange-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-orange-700 dark:text-orange-400">Demo Mode</p>
          <p className="text-sm text-orange-600 dark:text-orange-400/80">
            You&apos;re viewing a read-only demo of the CNCPT CMS. Explore all features freely!
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
        <Link href="/pricing">
          Start Free Trial
          <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
