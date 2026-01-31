'use client';

/**
 * Hook to manage chat context based on current route and entity
 *
 * Automatically detects the current page type and entity from the URL
 * and updates the chat store context with entity titles when available.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useChatContext } from '../lib/ai/chat-store';
import type { ChatContext } from '../lib/ai/chat-store';

interface ContextData {
  title?: string;
  data?: Record<string, unknown>;
}

/**
 * Fetch entity title based on context type and ID
 */
async function fetchEntityTitle(
  type: ChatContext['type'],
  id: string
): Promise<string | null> {
  try {
    let endpoint = '';
    switch (type) {
      case 'product':
        endpoint = `/api/admin/products/${id}`;
        break;
      case 'order':
        endpoint = `/api/admin/orders/${id}`;
        break;
      case 'page':
        endpoint = `/api/admin/pages/${id}`;
        break;
      case 'blog':
        endpoint = `/api/admin/blog/${id}`;
        break;
      case 'user':
        endpoint = `/api/admin/customers/${id}`;
        break;
      default:
        return null;
    }

    const response = await fetch(endpoint);
    if (!response.ok) return null;

    const data = await response.json();

    // Extract title based on entity type
    switch (type) {
      case 'product':
        return data.name || data.title || null;
      case 'order':
        return `Order #${data.orderNumber || id.slice(0, 8)}`;
      case 'page':
        return data.title || data.name || null;
      case 'blog':
        return data.title || null;
      case 'user':
        return data.name || data.email || null;
      default:
        return null;
    }
  } catch (error) {
    console.error('Failed to fetch entity title:', error);
    return null;
  }
}

/**
 * Hook that automatically sets chat context based on current route
 * and fetches entity titles when possible
 */
export function useAutoChatContext() {
  const pathname = usePathname();
  const params = useParams();
  const { context, setContext } = useChatContext();
  const lastFetchedRef = useRef<string | null>(null);

  // Update context when path changes
  useEffect(() => {
    if (!pathname) return;

    const newContext = detectContextFromPath(pathname, params);

    // Only update if context changed
    if (
      newContext.type !== context.type ||
      newContext.id !== context.id
    ) {
      setContext(newContext);

      // Reset the last fetched ref when context changes
      lastFetchedRef.current = null;
    }
  }, [pathname, params, setContext, context.type, context.id]);

  // Fetch entity title when we have an ID
  useEffect(() => {
    const fetchTitle = async () => {
      // Skip if already fetched, no ID, or already has title
      if (!context.id || context.title || context.type === 'general') return;

      const cacheKey = `${context.type}-${context.id}`;
      if (lastFetchedRef.current === cacheKey) return;

      lastFetchedRef.current = cacheKey;

      const title = await fetchEntityTitle(context.type, context.id);
      if (title) {
        setContext({
          ...context,
          title,
        });
      }
    };

    fetchTitle();
  }, [context, setContext]);
}

/**
 * Hook to manually set chat context with specific data
 */
export function useChatContextSetter() {
  const { context, setContext } = useChatContext();

  const setProductContext = (id: string, data?: ContextData) => {
    setContext({
      type: 'product',
      id,
      title: data?.title,
      data: data?.data,
    });
  };

  const setOrderContext = (id: string, data?: ContextData) => {
    setContext({
      type: 'order',
      id,
      title: data?.title,
      data: data?.data,
    });
  };

  const setPageContext = (id: string, data?: ContextData) => {
    setContext({
      type: 'page',
      id,
      title: data?.title,
      data: data?.data,
    });
  };

  const setBlogContext = (id: string, data?: ContextData) => {
    setContext({
      type: 'blog',
      id,
      title: data?.title,
      data: data?.data,
    });
  };

  const setUserContext = (id: string, data?: ContextData) => {
    setContext({
      type: 'user',
      id,
      title: data?.title,
      data: data?.data,
    });
  };

  const setGeneralContext = () => {
    setContext({ type: 'general' });
  };

  return {
    context,
    setContext,
    setProductContext,
    setOrderContext,
    setPageContext,
    setBlogContext,
    setUserContext,
    setGeneralContext,
  };
}

/**
 * Detect context type and ID from pathname
 */
function detectContextFromPath(
  pathname: string,
  params: Record<string, string | string[] | undefined> | null
): ChatContext {
  // Admin product pages
  if (pathname.startsWith('/admin/products/')) {
    const id = extractId(pathname, '/admin/products/');
    if (id && id !== 'new') {
      return { type: 'product', id };
    }
    return { type: 'product' };
  }

  if (pathname === '/admin/products') {
    return { type: 'product' };
  }

  // Admin order pages
  if (pathname.startsWith('/admin/orders/')) {
    const id = extractId(pathname, '/admin/orders/');
    if (id) {
      return { type: 'order', id };
    }
    return { type: 'order' };
  }

  if (pathname === '/admin/orders') {
    return { type: 'order' };
  }

  // Admin page pages
  if (pathname.startsWith('/admin/pages/')) {
    const id = extractId(pathname, '/admin/pages/');
    if (id && id !== 'new') {
      return { type: 'page', id };
    }
    return { type: 'page' };
  }

  if (pathname === '/admin/pages') {
    return { type: 'page' };
  }

  // Admin blog pages
  if (pathname.startsWith('/admin/blog/')) {
    const id = extractId(pathname, '/admin/blog/');
    if (id && id !== 'new') {
      return { type: 'blog', id };
    }
    return { type: 'blog' };
  }

  if (pathname === '/admin/blog') {
    return { type: 'blog' };
  }

  // Admin customer pages
  if (pathname.startsWith('/admin/customers/')) {
    const id = extractId(pathname, '/admin/customers/');
    if (id) {
      return { type: 'user', id };
    }
    return { type: 'user' };
  }

  if (pathname === '/admin/customers') {
    return { type: 'user' };
  }

  // Default to general context
  return { type: 'general' };
}

/**
 * Extract entity ID from pathname
 */
function extractId(pathname: string, prefix: string): string | null {
  const remaining = pathname.slice(prefix.length);
  const parts = remaining.split('/');
  const id = parts[0];

  // Return null for empty or special paths
  if (!id || id === 'new' || id === 'edit') {
    return null;
  }

  return id;
}
