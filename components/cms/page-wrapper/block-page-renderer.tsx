'use client';

/**
 * Block Page Renderer
 *
 * Client component that renders block editor content for CMS pages.
 * Renders block editor content as HTML with Tailwind classes.
 */

import { BlockRenderer } from '@/components/cms/page-wrapper/block-renderer';
import type { Block } from '@/lib/cms/block-editor/types';
import { getSmartBlock, isSmartBlock } from '@/lib/cms/block-editor/smart-blocks/registry';
import DOMPurify from 'isomorphic-dompurify';
import { Component, ErrorInfo, ReactNode, useMemo } from 'react';

// Side-effect imports — register smart block components in the registry
import '@/components/cms/smart-blocks/commerce';
import '@/components/cms/smart-blocks/dashboard';

export interface BlockPageRendererProps {
  blocks: Block[];
  className?: string;
  /** Serialized smart block data: blockId -> { key: value } */
  smartBlockData?: Record<string, Record<string, unknown>>;
}

/**
 * Error boundary to catch rendering errors in block content
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class BlockErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Block rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Content Rendering Error
          </h2>
          <p className="text-muted-foreground">
            There was an error rendering this page content.
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
 * Sanitize HTML in textContent fields to prevent XSS
 */
function sanitizeBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const sanitized = { ...block };

    if (sanitized.textContent && /<[a-z][\s\S]*>/i.test(sanitized.textContent)) {
      sanitized.textContent = DOMPurify.sanitize(sanitized.textContent, {
        ALLOWED_TAGS: [
          'b', 'i', 'u', 'em', 'strong', 's', 'del', 'a', 'br', 'span',
          'ul', 'ol', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'code', 'pre', 'sub', 'sup', 'mark',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      });
    }

    if (sanitized.children && sanitized.children.length > 0) {
      sanitized.children = sanitizeBlocks(sanitized.children);
    }

    return sanitized;
  });
}

/**
 * Renders block editor content for public page display.
 */
export function BlockPageRenderer({ blocks, className = '', smartBlockData = {} }: BlockPageRendererProps) {
  const sanitizedBlocks = useMemo(() => sanitizeBlocks(blocks), [blocks]);

  const renderBlock = (block: Block) => {
    // Check if this is a registered smart block
    if (isSmartBlock(block.componentName)) {
      const def = getSmartBlock(block.componentName!)
      if (def) {
        const data = smartBlockData[block.id] || {}
        const SmartComponent = def.component
        return <SmartComponent key={block.id} block={block} data={data} className={block.className} />
      }
    }
    // Default: render via BlockRenderer
    return (
      <BlockRenderer
        key={block.id}
        block={block}
        renderChildren={renderChildren}
        isPreview
      />
    )
  }

  const renderChildren = (children: Block[]) => {
    return children.map((child) => renderBlock(child));
  };

  if (!sanitizedBlocks || sanitizedBlocks.length === 0) {
    return (
      <div className={`block-content ${className}`}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">This page has no content yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`block-content ${className}`}>
      <BlockErrorBoundary>
        {sanitizedBlocks.map((block) => renderBlock(block))}
      </BlockErrorBoundary>
    </div>
  );
}

export default BlockPageRenderer;
