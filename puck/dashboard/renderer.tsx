'use client';

/**
 * Dashboard Renderer Component
 *
 * Client component that renders Puck content for customer dashboard pages.
 * Uses the dashboard Puck config with data-aware components.
 */

import { Render } from '@puckeditor/core';
import { dashboardPuckConfig } from './config';
import type { Data } from '@puckeditor/core';

export interface DashboardRendererProps {
  puckContent: Data;
  className?: string;
}

export function DashboardRenderer({ puckContent, className = '' }: DashboardRendererProps) {
  return (
    <div className={`dashboard-content ${className}`}>
      <Render config={dashboardPuckConfig} data={puckContent} />
    </div>
  );
}

export default DashboardRenderer;
