'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ShoppingCart,
  Package,
  Truck,
  Users,
  ClipboardList,
  CalendarDays,
  Settings,
  CreditCard,
  Star,
  AlertTriangle,
  CheckCheck,
  Eye,
  Trash2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';

const typeIcons: Record<string, typeof Bell> = {
  ORDER_PLACED: ShoppingCart,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: Package,
  ORDER_CANCELLED: AlertTriangle,
  PAYMENT_RECEIVED: CreditCard,
  PAYMENT_FAILED: AlertTriangle,
  REVIEW_APPROVED: Star,
  REVIEW_RESPONSE: Star,
  PRICE_DROP: Package,
  BACK_IN_STOCK: Package,
  WISHLIST_SALE: ShoppingCart,
  SUBSCRIPTION_RENEWAL: CreditCard,
  SUBSCRIPTION_CANCELLED: AlertTriangle,
  ACCOUNT_SECURITY: AlertTriangle,
  SYSTEM: Settings,
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const SWIPE_THRESHOLD = 70;

interface SwipeableNotificationProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
  };
  onTap: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}

function SwipeableNotification({ notification, onTap, onMarkRead, onDelete }: SwipeableNotificationProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isVerticalRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isDraggingRef.current = false;
    isVerticalRef.current = false;
    setTransitioning(false);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isVerticalRef.current) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // Determine scroll direction on first significant move
    if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      if (Math.abs(dy) > Math.abs(dx)) {
        isVerticalRef.current = true;
        return;
      }
      isDraggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (isDraggingRef.current) {
      // Clamp: right swipe only if unread, left swipe always allowed
      const clamped = notification.read
        ? Math.min(0, Math.max(-SWIPE_THRESHOLD - 20, dx))
        : Math.max(-SWIPE_THRESHOLD - 20, Math.min(SWIPE_THRESHOLD + 20, dx));
      setOffsetX(clamped);
    }
  }, [notification.read]);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) {
      // It was a tap, not a swipe
      onTap();
      return;
    }

    isDraggingRef.current = false;
    setTransitioning(true);

    if (offsetX > SWIPE_THRESHOLD && !notification.read) {
      // Swipe right past threshold → mark as read
      setOffsetX(0);
      onMarkRead();
    } else if (offsetX < -SWIPE_THRESHOLD) {
      // Swipe left past threshold → delete
      setOffsetX(-300);
      setTimeout(onDelete, 200);
    } else {
      // Snap back
      setOffsetX(0);
    }
  }, [offsetX, notification.read, onTap, onMarkRead, onDelete]);

  const Icon = typeIcons[notification.type] || Bell;

  return (
    <div className="relative overflow-hidden">
      {/* Action backgrounds revealed by swiping */}
      {/* Right swipe → Mark as read (green/primary) */}
      <div className="absolute inset-y-0 left-0 flex items-center px-4 bg-primary text-primary-foreground" style={{ width: '100%' }}>
        <Eye className="h-4 w-4 mr-1.5" />
        <span className="text-xs font-medium">Mark read</span>
      </div>
      {/* Left swipe → Delete (red/destructive) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-destructive text-destructive-foreground" style={{ width: '100%' }}>
        <span className="text-xs font-medium">Delete</span>
        <Trash2 className="h-4 w-4 ml-1.5" />
      </div>

      {/* Main notification row */}
      <div
        className={`relative flex items-start gap-3 px-4 py-3 bg-popover cursor-pointer select-none ${
          !notification.read ? 'bg-accent/20' : ''
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: transitioning ? 'transform 200ms ease-out' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { isDraggingRef.current = false; setTransitioning(true); setOffsetX(0); }}
      >
        <div className="mt-0.5 shrink-0">
          <Icon className={`h-4 w-4 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${!notification.read ? 'font-semibold' : ''}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {timeAgo(notification.createdAt)}
          </p>
        </div>
        {!notification.read && (
          <div className="mt-2 shrink-0">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="divide-y divide-border">
              {notifications.map(notification => (
                <SwipeableNotification
                  key={notification.id}
                  notification={notification}
                  onTap={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.link) router.push(notification.link);
                  }}
                  onMarkRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
