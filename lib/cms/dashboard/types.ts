/**
 * Customer Dashboard Configuration Types
 *
 * Defines the structure for configurable, modular dashboards
 * that can be customized for different business types:
 * - E-commerce: Orders, shipping, payment methods
 * - Consulting: Projects, invoices, scheduling
 * - Services: Bookings, subscriptions, usage
 * - General: Profile, addresses, notifications
 */

/**
 * Available dashboard widget types
 */
export type DashboardWidgetType =
  // Core widgets (all dashboard types)
  | 'profile-overview'
  | 'quick-actions'
  | 'notifications'
  | 'support'
  // E-commerce widgets
  | 'recent-orders'
  | 'order-tracking'
  | 'payment-methods'
  | 'addresses'
  | 'wishlist'
  | 'loyalty-points'
  | 'subscriptions'
  // Consulting/Services widgets
  | 'active-projects'
  | 'project-milestones'
  | 'invoices'
  | 'upcoming-meetings'
  | 'time-tracking'
  | 'documents'
  // Bookings/Appointments
  | 'upcoming-bookings'
  | 'booking-history'
  | 'available-services'
  // Usage-based
  | 'usage-stats'
  | 'billing-summary'
  | 'api-keys';

/**
 * Dashboard preset types
 */
export type DashboardPreset =
  | 'ecommerce'
  | 'consulting'
  | 'services'
  | 'booking'
  | 'saas'
  | 'custom';

/**
 * Widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  description?: string;
  enabled: boolean;
  /** Grid column span (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
  /** Sort order (lower = first) */
  order: number;
  /** Widget-specific settings */
  settings?: Record<string, unknown>;
}

/**
 * Dashboard tab configuration
 */
export interface DashboardTab {
  id: string;
  label: string;
  icon?: string;
  slug: string;
  enabled: boolean;
  order: number;
  widgets: DashboardWidget[];
}

/**
 * Full dashboard configuration
 */
export interface DashboardConfig {
  /** Preset type for quick configuration */
  preset: DashboardPreset;
  /** Dashboard title shown to customers */
  title: string;
  /** Whether to show the main overview tab */
  showOverview: boolean;
  /** Tabs configuration */
  tabs: DashboardTab[];
  /** Theme customization */
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg';
    cardStyle?: 'flat' | 'bordered' | 'elevated';
  };
}

/**
 * Default widget configurations by type
 */
export const DEFAULT_WIDGETS: Record<DashboardWidgetType, Partial<DashboardWidget>> = {
  // Core
  'profile-overview': { title: 'Profile', colSpan: 2 },
  'quick-actions': { title: 'Quick Actions', colSpan: 2 },
  'notifications': { title: 'Notifications', colSpan: 1 },
  'support': { title: 'Need Help?', colSpan: 1 },
  // E-commerce
  'recent-orders': { title: 'Recent Orders', colSpan: 4 },
  'order-tracking': { title: 'Track Your Order', colSpan: 2 },
  'payment-methods': { title: 'Payment Methods', colSpan: 2 },
  'addresses': { title: 'Addresses', colSpan: 2 },
  'wishlist': { title: 'Wishlist', colSpan: 2 },
  'loyalty-points': { title: 'Rewards', colSpan: 1 },
  'subscriptions': { title: 'Subscriptions', colSpan: 2 },
  // Consulting
  'active-projects': { title: 'Active Projects', colSpan: 4 },
  'project-milestones': { title: 'Milestones', colSpan: 2 },
  'invoices': { title: 'Invoices', colSpan: 2 },
  'upcoming-meetings': { title: 'Upcoming Meetings', colSpan: 2 },
  'time-tracking': { title: 'Time Tracking', colSpan: 2 },
  'documents': { title: 'Documents', colSpan: 2 },
  // Bookings
  'upcoming-bookings': { title: 'Upcoming Bookings', colSpan: 4 },
  'booking-history': { title: 'Past Bookings', colSpan: 4 },
  'available-services': { title: 'Book a Service', colSpan: 2 },
  // SaaS
  'usage-stats': { title: 'Usage', colSpan: 2 },
  'billing-summary': { title: 'Billing', colSpan: 2 },
  'api-keys': { title: 'API Keys', colSpan: 2 },
};

/**
 * Preset configurations
 */
export const DASHBOARD_PRESETS: Record<DashboardPreset, Partial<DashboardConfig>> = {
  ecommerce: {
    title: 'My Account',
    showOverview: true,
    tabs: [
      {
        id: 'orders',
        label: 'Orders',
        slug: 'orders',
        icon: 'package',
        enabled: true,
        order: 1,
        widgets: [
          { id: 'recent-orders', type: 'recent-orders', title: 'Orders', enabled: true, order: 1 },
        ],
      },
      {
        id: 'addresses',
        label: 'Addresses',
        slug: 'addresses',
        icon: 'map-pin',
        enabled: true,
        order: 2,
        widgets: [
          { id: 'addresses', type: 'addresses', title: 'Addresses', enabled: true, order: 1 },
        ],
      },
      {
        id: 'payments',
        label: 'Payment Methods',
        slug: 'payments',
        icon: 'credit-card',
        enabled: true,
        order: 3,
        widgets: [
          { id: 'payment-methods', type: 'payment-methods', title: 'Payment Methods', enabled: true, order: 1 },
        ],
      },
    ],
  },
  consulting: {
    title: 'Client Portal',
    showOverview: true,
    tabs: [
      {
        id: 'projects',
        label: 'Projects',
        slug: 'projects',
        icon: 'briefcase',
        enabled: true,
        order: 1,
        widgets: [
          { id: 'active-projects', type: 'active-projects', title: 'Your Projects', enabled: true, order: 1 },
        ],
      },
      {
        id: 'billing',
        label: 'Billing',
        slug: 'billing',
        icon: 'file-text',
        enabled: true,
        order: 2,
        widgets: [
          { id: 'invoices', type: 'invoices', title: 'Invoices', enabled: true, order: 1 },
        ],
      },
      {
        id: 'meetings',
        label: 'Meetings',
        slug: 'meetings',
        icon: 'calendar',
        enabled: true,
        order: 3,
        widgets: [
          { id: 'upcoming-meetings', type: 'upcoming-meetings', title: 'Upcoming Meetings', enabled: true, order: 1 },
        ],
      },
      {
        id: 'documents',
        label: 'Documents',
        slug: 'documents',
        icon: 'folder',
        enabled: true,
        order: 4,
        widgets: [
          { id: 'documents', type: 'documents', title: 'Shared Documents', enabled: true, order: 1 },
        ],
      },
    ],
  },
  services: {
    title: 'My Account',
    showOverview: true,
    tabs: [
      {
        id: 'bookings',
        label: 'My Bookings',
        slug: 'bookings',
        icon: 'calendar-check',
        enabled: true,
        order: 1,
        widgets: [
          { id: 'upcoming-bookings', type: 'upcoming-bookings', title: 'Upcoming', enabled: true, order: 1 },
          { id: 'booking-history', type: 'booking-history', title: 'History', enabled: true, order: 2 },
        ],
      },
      {
        id: 'services',
        label: 'Book',
        slug: 'book',
        icon: 'plus-circle',
        enabled: true,
        order: 2,
        widgets: [
          { id: 'available-services', type: 'available-services', title: 'Book a Service', enabled: true, order: 1 },
        ],
      },
    ],
  },
  booking: {
    title: 'My Reservations',
    showOverview: true,
    tabs: [
      {
        id: 'reservations',
        label: 'Reservations',
        slug: 'reservations',
        icon: 'calendar',
        enabled: true,
        order: 1,
        widgets: [
          { id: 'upcoming-bookings', type: 'upcoming-bookings', title: 'Upcoming', enabled: true, order: 1 },
        ],
      },
    ],
  },
  saas: {
    title: 'Dashboard',
    showOverview: true,
    tabs: [
      {
        id: 'usage',
        label: 'Usage',
        slug: 'usage',
        icon: 'bar-chart',
        enabled: true,
        order: 1,
        widgets: [
          { id: 'usage-stats', type: 'usage-stats', title: 'Usage Statistics', enabled: true, order: 1 },
        ],
      },
      {
        id: 'billing',
        label: 'Billing',
        slug: 'billing',
        icon: 'credit-card',
        enabled: true,
        order: 2,
        widgets: [
          { id: 'billing-summary', type: 'billing-summary', title: 'Billing', enabled: true, order: 1 },
          { id: 'invoices', type: 'invoices', title: 'Invoices', enabled: true, order: 2 },
        ],
      },
      {
        id: 'api',
        label: 'API',
        slug: 'api',
        icon: 'code',
        enabled: true,
        order: 3,
        widgets: [
          { id: 'api-keys', type: 'api-keys', title: 'API Keys', enabled: true, order: 1 },
        ],
      },
    ],
  },
  custom: {
    title: 'My Account',
    showOverview: true,
    tabs: [],
  },
};

/**
 * Get default dashboard configuration for a preset
 */
export function getDefaultDashboardConfig(preset: DashboardPreset = 'ecommerce'): DashboardConfig {
  const presetConfig = DASHBOARD_PRESETS[preset];
  return {
    preset,
    title: presetConfig.title || 'My Account',
    showOverview: presetConfig.showOverview ?? true,
    tabs: presetConfig.tabs || [],
    theme: {
      borderRadius: 'md',
      cardStyle: 'bordered',
    },
  };
}
