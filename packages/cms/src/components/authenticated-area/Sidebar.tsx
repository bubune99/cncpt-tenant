'use client';

/**
 * Authenticated Area Sidebar
 *
 * Renders navigation for an authenticated area with
 * dynamic Puck pages and collapsible groups.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Plus, FileText } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { NavGroup, NavItem } from '@/lib/authenticated-routes/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  areaId: string;
  areaName: string;
  basePath: string;
  groups: NavGroup[];
  className?: string;
  onCreatePage?: () => void;
  canCreatePages?: boolean;
}

// Dynamic icon component
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) {
    return <FileText className={className} />;
  }
  return <IconComponent className={className} />;
}

export function AuthenticatedAreaSidebar({
  areaId,
  areaName,
  basePath,
  groups,
  className,
  onCreatePage,
  canCreatePages = true,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Initialize with default expanded groups
    const expanded = new Set<string>();
    groups.forEach(group => {
      if (group.defaultExpanded !== false) {
        expanded.add(group.id);
      }
    });
    return expanded;
  });

  // Update expanded groups when groups change
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      groups.forEach(group => {
        if (group.defaultExpanded && !prev.has(group.id)) {
          next.add(group.id);
        }
      });
      return next;
    });
  }, [groups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath;
    }
    return pathname?.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          item.isPuckPage && 'border-l-2 border-transparent',
          item.isPuckPage && active && 'border-l-primary'
        )}
      >
        {item.icon && <DynamicIcon name={item.icon} className="h-4 w-4 shrink-0" />}
        <span className="truncate">{item.label}</span>
        {item.badge && (
          <span
            className={cn(
              'ml-auto text-xs px-1.5 py-0.5 rounded-full',
              item.badgeVariant === 'success' && 'bg-green-100 text-green-700',
              item.badgeVariant === 'warning' && 'bg-yellow-100 text-yellow-700',
              item.badgeVariant === 'destructive' && 'bg-red-100 text-red-700',
              !item.badgeVariant && 'bg-primary/10 text-primary'
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const hasPuckPages = group.items.some(item => item.isPuckPage);

    return (
      <div key={group.id} className="space-y-1">
        {/* Group header */}
        {group.collapsible !== false ? (
          <button
            onClick={() => toggleGroup(group.id)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>{group.label}</span>
            <div className="flex items-center gap-1">
              {hasPuckPages && canCreatePages && onCreatePage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePage();
                  }}
                  className="p-0.5 rounded hover:bg-accent"
                  title="Create new page"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
        ) : (
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.label}
          </div>
        )}

        {/* Group items */}
        {(group.collapsible === false || isExpanded) && (
          <div className="space-y-0.5">
            {group.items.map(renderNavItem)}

            {/* Empty state for Puck pages group */}
            {hasPuckPages === false &&
              group.items.length === 0 &&
              canCreatePages &&
              onCreatePage && (
                <button
                  onClick={onCreatePage}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create first page</span>
                </button>
              )}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={cn('flex flex-col gap-4', className)}>
      {groups.map(renderNavGroup)}
    </nav>
  );
}
