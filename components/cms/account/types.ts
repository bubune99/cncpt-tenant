/**
 * Atlas Customer Account — shared types
 * All interfaces for the white-label customer portal.
 */

export type AccountSection =
  | 'overview'
  | 'orders'
  | 'inbox'
  | 'subs'
  | 'wishlist'
  | 'returns'
  | 'reviews'
  | 'addresses'
  | 'payment'
  | 'loyalty'
  | 'comms'
  | 'notifications'
  | 'profile';

export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

export interface NavItem {
  readonly key: AccountSection;
  readonly label: string;
  readonly count?: string | null;
}

export interface NotificationItem {
  readonly id: string;
  readonly kind: 'order' | 'stock' | 'sub' | 'review' | 'editorial';
  readonly state: 'read' | 'unread';
  readonly glyph: string;
  readonly tone: 'accent' | 'success' | 'gold' | 'ink';
  readonly title: string;
  readonly body: string;
  readonly when: string;
  readonly cta: string;
}

export interface TrackingStep {
  readonly key: string;
  readonly label: string;
  readonly when: string;
  readonly state: 'done' | 'now' | 'future';
}

export interface OrderRow {
  readonly id: string;
  readonly orderNumber: string;
  readonly createdAt: string;
  readonly status: string;
  readonly total: number;
  readonly itemCount: number;
  readonly items?: readonly OrderItemRow[];
  readonly shipment?: {
    readonly trackingNumber?: string | null;
    readonly trackingUrl?: string | null;
    readonly carrier?: string | null;
  } | null;
  readonly shippingAddress?: AddressData | null;
  readonly billingAddress?: AddressData | null;
  readonly subtotal?: number;
  readonly shippingTotal?: number;
  readonly taxTotal?: number;
  readonly discountTotal?: number;
}

export interface OrderItemRow {
  readonly id: string;
  readonly productTitle: string;
  readonly variantSku?: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly image?: string | null;
}

export interface AddressData {
  readonly name: string;
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  readonly country: string;
  readonly phone?: string | null;
  readonly isDefault?: boolean;
}
