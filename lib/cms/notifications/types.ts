/**
 * Notification Types
 */

export type NotificationType =
  | 'order_confirmation'
  | 'shipping_notification'
  | 'delivery_confirmation'
  | 'refund_notification'
  | 'cart_abandonment'
  | 'password_reset'
  | 'welcome';

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationPreferences {
  userId: string;
  orderConfirmation: boolean;
  shippingUpdates: boolean;
  deliveryConfirmation: boolean;
  promotionalEmails: boolean;
  newsletterEmails: boolean;
}

export interface NotificationLog {
  id: string;
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  orderId?: string;
  shipmentId?: string;
  messageId?: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  error?: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
}
