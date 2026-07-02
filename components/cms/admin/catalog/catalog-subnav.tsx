'use client';

/**
 * CatalogSubnav — a small tab strip that ties the three catalog surfaces
 * (Products / Collections / Inventory) together. The primary AdminShell nav
 * only links Products, so this is how the sibling screens stay reachable.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Layers, Boxes, type LucideIcon } from 'lucide-react';
import { useCMSConfig } from '@/contexts/CMSConfigContext';

interface Tab {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

const TABS: readonly Tab[] = [
  { key: 'products', label: 'Products', href: '/admin/products', icon: Package },
  { key: 'collections', label: 'Collections', href: '/admin/collections', icon: Layers },
  { key: 'inventory', label: 'Inventory', href: '/admin/inventory', icon: Boxes },
];

export function CatalogSubnav({ active }: { readonly active: string }): React.ReactElement {
  const { buildPath } = useCMSConfig();
  const pathname = usePathname() || '';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 18,
        flexWrap: 'wrap',
      }}
    >
      {TABS.map((t) => {
        const on = active === t.key || pathname.endsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={buildPath(t.href)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              borderRadius: 999,
              padding: '6px 13px',
              fontSize: 13,
              fontWeight: on ? 600 : 500,
              textDecoration: 'none',
              border: '1px solid ' + (on ? 'transparent' : 'var(--line)'),
              background: on ? 'var(--ink-900)' : 'var(--surface-raised)',
              color: on ? 'var(--surface-raised)' : 'var(--text-secondary)',
              boxShadow: on ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
              transition: 'all .14s',
            }}
          >
            <Icon size={14} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
