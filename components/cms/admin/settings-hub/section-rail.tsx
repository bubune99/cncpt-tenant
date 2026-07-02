'use client';

/**
 * Settings hub left rail. Renders SETTINGS_SECTIONS as grouped .set-nav items.
 * Active state is derived from the pathname suffix so it works regardless of the
 * subdomain prefix the middleware rewrites in. External items open surfaces that
 * live outside the settings/ tree and carry an ↗ marker.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { SETTINGS_SECTIONS } from './sections';

export function SectionRail(): React.ReactElement {
  const pathname = usePathname() ?? '';
  const { buildPath } = useCMSConfig();

  const isActive = (route: string): boolean => {
    const clean = pathname.split('?')[0].replace(/\/$/, '');
    return clean.endsWith(route);
  };

  return (
    <div className="gr-scroll set-rail">
      {SETTINGS_SECTIONS.map((section, i) => (
        <React.Fragment key={section.group}>
          <div
            className="gr-eyebrow"
            style={{ padding: i === 0 ? '4px 10px 8px' : '16px 10px 8px' }}
          >
            {section.group}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = !item.external && isActive(item.route);
            return (
              <Link
                key={item.key}
                href={buildPath(item.route)}
                className={'set-nav' + (active ? ' on' : '')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={17} style={{ flex: 'none' }} />
                {item.label}
                {item.external && <ArrowUpRight size={13} className="set-nav-ext" />}
              </Link>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
