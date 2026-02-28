'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface SidebarCounts {
  [key: string]: number;
}

export function useNotifications() {
  const { dbUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCounts, setSidebarCounts] = useState<SidebarCounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!dbUser?.id) return;
    try {
      const res = await fetch('/api/cms/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dbUser?.id]);

  const fetchSidebarCounts = useCallback(async () => {
    if (!dbUser?.id) return;
    try {
      const res = await fetch('/api/cms/notifications/unread-counts');
      if (res.ok) {
        const data = await res.json();
        setSidebarCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch sidebar counts:', err);
    }
  }, [dbUser?.id]);

  const fetchAll = useCallback(() => {
    fetchNotifications();
    fetchSidebarCounts();
  }, [fetchNotifications, fetchSidebarCounts]);

  useEffect(() => {
    if (!dbUser?.id) {
      setIsLoading(false);
      return;
    }

    fetchAll();

    intervalRef.current = setInterval(fetchAll, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dbUser?.id, fetchAll]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Find entityType for sidebar count update
    const notification = notifications.find(n => n.id === id);
    if (notification?.entityType && !notification.read) {
      setSidebarCounts(prev => {
        const key = notification.entityType!;
        const current = prev[key] || 0;
        if (current <= 1) {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: current - 1 };
      });
    }

    try {
      await fetch(`/api/cms/notifications/${id}`, { method: 'PATCH' });
    } catch {
      // Revert on error
      fetchAll();
    }
  }, [notifications, fetchAll]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    setSidebarCounts({});

    try {
      await fetch('/api/cms/notifications/mark-all-read', { method: 'POST' });
    } catch {
      fetchAll();
    }
  }, [fetchAll]);

  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);

    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (notification.entityType) {
        setSidebarCounts(prev => {
          const key = notification.entityType!;
          const current = prev[key] || 0;
          if (current <= 1) {
            const { [key]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, [key]: current - 1 };
        });
      }
    }

    try {
      await fetch(`/api/cms/notifications/${id}`, { method: 'DELETE' });
    } catch {
      fetchAll();
    }
  }, [notifications, fetchAll]);

  return {
    notifications,
    unreadCount,
    sidebarCounts,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
