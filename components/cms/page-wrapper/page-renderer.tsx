'use client';

/**
 * Page Renderer Component
 *
 * Client component that renders Puck content for CMS pages.
 * Used inside PageWrapper for full page rendering with header/footer.
 */

import { Render } from '@puckeditor/core';
import { pagesPuckConfig } from '@/puck/pages/config';
import type { Data } from '@puckeditor/core';
import { Component, ErrorInfo, ReactNode } from 'react';

export interface PageRendererProps {
  puckContent: Data;
  className?: string;
}

/**
 * Error boundary to catch rendering errors in Puck content
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PuckErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Puck rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Content Rendering Error
          </h2>
          <p className="text-muted-foreground">
            There was an error rendering this page content. Please try editing the page in the editor.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 p-4 bg-muted rounded text-left text-sm overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Validate Puck data structure before rendering
 */
function validatePuckData(data: Data): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.content)) return false;

  // Check each component has valid type (string)
  for (const item of data.content) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.type !== 'string') {
      console.error('Invalid component type:', item.type, 'in component:', item);
      return false;
    }
  }

  return true;
}

export function PageRenderer({ puckContent, className = '' }: PageRendererProps) {
  // Validate data before rendering
  if (!validatePuckData(puckContent)) {
    console.error('Invalid Puck data structure:', puckContent);
    return (
      <div className={`puck-content ${className}`}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Invalid Page Content
          </h2>
          <p className="text-muted-foreground">
            This page has invalid content data. Please edit the page in the editor to fix it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`puck-content ${className}`}>
      <PuckErrorBoundary>
        <Render config={pagesPuckConfig} data={puckContent} />
      </PuckErrorBoundary>
    </div>
  );
}

export default PageRenderer;
